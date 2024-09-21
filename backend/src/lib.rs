use models::message_model::{MessageIn, MessageOut};
use sea_orm::DatabaseConnection;
use serde_json::Value;
use socketioxide::{extract::{Data, SocketRef}, layer::SocketIoLayer, SocketIo};
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tower_http::cors::CorsLayer;
use tracing::info;
use tracing_subscriber::FmtSubscriber;
mod routes;
mod handlers;
mod models;
mod auth;
mod middlewares;
mod redis_manager;

async fn on_connect(socket: SocketRef){
    info!("socket connected: {}", socket.id);

    socket.on("join", |socket: SocketRef, Data::<String>(room)| {
        if let Err(e) = socket.leave_all() {
            info!("Error leaving all rooms: {}", e);
        }
        if let Err(e) = socket.join(room.clone()) {
            info!("Error joining room {}: {}", room, e);
        } else {
            info!("User joined room: {}", room);
        }
    });

    socket.on("message", |socket: SocketRef, Data::<MessageIn>(data)|{
        info!("Received message in room: {} with content: {}", data.room, data.content);

        let response = MessageOut {
            content: data.content,
            user_id: socket.id.to_string(),
            date: chrono::Utc::now(), 
        };
        let _ = socket.within(data.room.clone()).emit("message", response);
        info!("Message was sent to room {:?}", data.room);
    });

}

pub async fn run(db : DatabaseConnection) -> Result<(), Box<dyn std::error::Error>>{

    tracing::subscriber::set_global_default(FmtSubscriber::default())?;

    let (ws_layer, io) = SocketIo::new_layer();
    io.ns("/", on_connect);

    let app = routes::create_all_routes(db, ws_layer);

    let listener: TcpListener = TcpListener::bind("127.0.0.1:3001")
        .await?;

    axum::serve(listener, app)
        .await
        .unwrap();

    Ok(())

}