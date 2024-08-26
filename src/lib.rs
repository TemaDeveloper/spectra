use sea_orm::DatabaseConnection;
use tokio::net::TcpListener;
mod routes;
mod handlers;
mod models;

pub async fn run(db : DatabaseConnection) {

    let app = routes::create_all_routes(db);
    let listener = TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();

    axum::serve(listener, app)
        .await
        .unwrap();

}