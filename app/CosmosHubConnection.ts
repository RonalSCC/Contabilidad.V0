import { HubConnectionBuilder } from "@microsoft/signalr";
var connection = new HubConnectionBuilder().withUrl("http://localhost:5000/cosmosHub").build();
connection.start();
export { connection };