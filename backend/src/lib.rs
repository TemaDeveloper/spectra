use std::sync::Arc;
use handlers::message_handler::send_message;
use models::message_model::{MessageIn, MessageOut, MessagePosting};
use sea_orm::DatabaseConnection;
use socketioxide::{
    extract::{Data, SocketRef},
    SocketIo,
};
use tokio::net::TcpListener;
use tracing::info;
use tracing_subscriber::FmtSubscriber;
mod auth;
mod handlers;
mod middlewares;
mod models;
mod redis_manager;
mod routes;

async fn on_connect(socket: SocketRef, db: Arc<DatabaseConnection>) {
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

    socket.on("message", |socket: SocketRef, Data::<MessageIn>(data)| {
        info!(
            "Received message in room: {} with content: {}",
            data.room, data.content
        );

        let response = MessageOut {
            content: data.content.clone(),
            user_id: data.user_id, //TODO: change from socket.id to Uuid
            date: chrono::Utc::now(),
        };
        let _ = socket.within(data.room.clone()).emit("message", response.clone());

        tokio::spawn(async move {
            send_message(
                db,
                axum::Json(MessagePosting {
                    content: data.content.to_string(),
                    user_id: data.user_id, //TODO: Change the user_id to actual id of a user
                    room: data.room.to_string(),
                    sending_time: response.date.to_string(),
                }),
            )
            .await;
        });
//        info!("Message was sent to room {:?}", data.room);
    });
}

pub async fn run(db: DatabaseConnection) -> Result<(), Box<dyn std::error::Error>> {
    let db = Arc::new(db);

    tracing::subscriber::set_global_default(FmtSubscriber::default())?;

    let (ws_layer, io) = SocketIo::new_layer();
    let db_for_socket = Arc::clone(&db);

    io.ns("/", move |socket| on_connect(socket, db_for_socket.clone()));
    
    //retrive all messages via HTTP
    let app = routes::create_all_routes(Arc::clone(&db), ws_layer);
    let listener: TcpListener = TcpListener::bind("127.0.0.1:3001").await?;
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
