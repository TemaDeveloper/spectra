use sea_orm::DatabaseConnection;
use socketioxide::{extract::SocketRef, SocketIo};
use tokio::net::TcpListener;
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
}

//TODO: Change to Web Sockets
pub async fn run(db : DatabaseConnection) -> Result<(), Box<dyn std::error::Error>>{

    tracing::subscriber::set_global_default(FmtSubscriber::default())?;

    let (layer, io) = SocketIo::new_layer();

    io.ns("/", on_connect);

    let app = routes::create_all_routes(db).layer(layer);
    let listener: TcpListener = TcpListener::bind("127.0.0.1:3001")
        .await
        .unwrap();

    axum::serve(listener, app)
        .await
        .unwrap();

    Ok(())

}