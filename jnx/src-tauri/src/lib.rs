use tauri_plugin_sql::{Migration, MigrationKind};
use serde::Serialize;

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
            .add_migrations("sqlite:JNX.db", vec![
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
        .invoke_handler(tauri::generate_handler![custom_fetch])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
