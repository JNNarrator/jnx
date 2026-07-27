use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_store;
use serde::Serialize;
use tauri::{Emitter, Manager};

fn extract_query_param<'a>(s: &'a str, param: &str) -> Option<&'a str> {
    let query_start = s.find('?')?;
    let query = &s[query_start + 1..];
    for pair in query.split('&') {
        let mut parts = pair.splitn(2, '=');
        let key = parts.next()?;
        if key == param {
            return Some(parts.next().unwrap_or(""));
        }
    }
    None
}

/// Try to extract a ticket/token from the URL query string.
/// Checks multiple common SSO parameter names in order.
fn extract_sso_token(url: &str) -> Option<String> {
    for param in &["ticket", "satoken", "code", "token", "st"] {
        if let Some(val) = extract_query_param(url, param) {
            if !val.is_empty() {
                return Some(val.to_string());
            }
        }
    }
    None
}

#[tauri::command]
fn open_sso_login(
    app: tauri::AppHandle,
    auth_url: String,
    callback_url: String,
) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("sso-login") {
        let _ = w.close();
    }

    let url = reqwest::Url::parse(&auth_url).map_err(|e| format!("url: {e}"))?;

    let window = tauri::WebviewWindowBuilder::new(
        &app,
        "sso-login",
        tauri::WebviewUrl::External(url),
    )
    .inner_size(600.0, 800.0)
    .center()
    .resizable(false)
    .title("JNX - SSO登录")
    .on_navigation({
        let app = app.clone();
        let cb = callback_url.clone();
        move |nav_url| {
            let s = nav_url.as_str();
            let matches = s.starts_with(&cb);
            let ticket = extract_sso_token(s);

            eprintln!("[SSO NAV] url={} matches={} ticket={:?}", s, matches, ticket);

            let _ = app.emit("sso-debug-nav", serde_json::json!({
                "url": s,
                "matches": matches,
                "ticket": ticket,
            }));

            if matches {
                if let Some(ref t) = ticket {
                    let _ = app.emit("sso-ticket", serde_json::json!({ "ticket": t }));
                    // Only close window when we actually have a ticket
                    if let Some(w) = app.get_webview_window("sso-login") {
                        let _ = w.close();
                    }
                    false
                } else {
                    // Callback URL matched but no ticket found — let the page load
                    // so the user can see what happened; log for debugging
                    eprintln!("[SSO WARN] callback URL matched but no ticket/token found in query");
                    true
                }
            } else {
                true
            }
        }
    })
    .build()
    .map_err(|e| format!("build: {e}"))?;

    let app2 = app.clone();
    window.on_window_event(move |event| {
        if matches!(event, tauri::WindowEvent::CloseRequested { .. }) {
            let _ = app2.emit("sso-login-cancelled", ());
        }
    });

    Ok(())
}

#[derive(Serialize)]
struct CustomFetchResponse {
    status: u16,
    status_text: String,
    headers: Vec<[String; 2]>,
    body: String,
    time_ms: u64,
    size_bytes: u64,
}

#[tauri::command]
async fn custom_fetch(
    method: String,
    url: String,
    headers: Vec<[String; 2]>,
    body: Option<String>,
) -> Result<CustomFetchResponse, String> {
    let client = reqwest::Client::builder()
        .user_agent("")
        .build()
        .map_err(|e| format!("build client: {e}"))?;

    let mut req = client
        .request(
            reqwest::Method::from_bytes(method.as_bytes())
                .map_err(|e| format!("bad method: {e}"))?,
            &url,
        );

    for pair in &headers {
        if pair.len() == 2 {
            req = req.header(&pair[0], &pair[1]);
        }
    }

    if let Some(body) = body {
        req = req.body(body);
    }

    let start = std::time::Instant::now();
    let resp = req.send().await.map_err(|e| format!("{e}"))?;
    let elapsed = start.elapsed();

    let status = resp.status().as_u16();
    let status_text = resp.status().canonical_reason().unwrap_or("").to_string();
    let resp_headers: Vec<[String; 2]> = resp
        .headers()
        .iter()
        .map(|(k, v)| [k.to_string(), v.to_str().unwrap_or("").to_string()])
        .collect();
    let body_bytes = resp.bytes().await.map_err(|e| format!("read body: {e}"))?;
    let body_str = String::from_utf8_lossy(&body_bytes).to_string();

    Ok(CustomFetchResponse {
        status,
        status_text,
        headers: resp_headers,
        body: body_str,
        time_ms: elapsed.as_millis() as u64,
        size_bytes: body_bytes.len() as u64,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default()
            .add_migrations("sqlite:jnx.db", vec![
                Migration {
                    version: 1,
                    description: "create initial tables",
                    sql: "CREATE TABLE IF NOT EXISTS settings (
                        key TEXT PRIMARY KEY, value TEXT NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS clipboard_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        content TEXT NOT NULL, source TEXT DEFAULT '',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                    INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'system');
                    INSERT OR IGNORE INTO settings (key, value) VALUES ('tab_max_rows', '3');
                    INSERT OR IGNORE INTO settings (key, value) VALUES ('tabs_per_row', '6');
                    INSERT OR IGNORE INTO settings (key, value) VALUES ('clipboard_poll_interval', '2000');",
                    kind: MigrationKind::Up,
                },
            ])
            .build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![custom_fetch, open_sso_login])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
