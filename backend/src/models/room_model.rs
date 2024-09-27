use serde::{Deserialize, Serialize};


#[derive(Serialize, Deserialize)]
pub struct RoomGeneration{
    pub room_name : String,
}

#[derive(Serialize, Deserialize)]
pub struct RoomRecieveing{
    pub room_name : String, 
    pub room_id : i32,
}
#[derive(Serialize, Deserialize, Default)]
pub struct AllRoomsRecieveing{
    pub rooms : Vec<RoomRecieveing>
}