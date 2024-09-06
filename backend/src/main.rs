use std::env;

use sea_orm::Database;
use dotenv::dotenv;
use backend::run;

#[tokio::main]
async fn main() -> anyhow::Result<()> {

     //init dotenv
     dotenv().ok();
     let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
     let db_conn = Database::connect(&db_url).await?;
 
     run(db_conn).await;
 
     Ok(())

}
