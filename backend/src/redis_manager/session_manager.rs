use dotenv::dotenv;
use redis::{aio::MultiplexedConnection, AsyncCommands, Client};
use std::{env, error::Error};


pub async fn connect_redis() -> MultiplexedConnection {
    dotenv().ok();
    let redis_url = env::var("REDIS_URL").expect("REDIS_URL must be set");
    let client = Client::open(redis_url).unwrap();
    let con = client.get_multiplexed_tokio_connection().await.unwrap();
    con
}

pub async fn set_session_id(bearer_id : String, uuid : String) -> Result<(), Box<dyn Error>> {
    let mut con = connect_redis().await;
    let session_set = con.set_ex(&bearer_id, &uuid, 86400).await?;
    Ok(session_set)
}

pub async fn get_session_id(bearer_id : String) -> redis::RedisResult<bool>{
    let mut con = connect_redis().await;
    let exists: bool = con.exists(&bearer_id).await?;
    Ok(exists)
}