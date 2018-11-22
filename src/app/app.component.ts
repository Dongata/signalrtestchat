import { Component, Input, OnInit } from '@angular/core';
import * as SignalR from '@aspnet/signalr'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private _connection : SignalR.HubConnection;

  title = 'signalrtest';
  @Input() username:string;
  @Input() message:string;
  messages:string[] = [];

  ngOnInit(): void {
    this._connection = new SignalR.HubConnectionBuilder()
      .withUrl("https://nginxv2.southcentralus.cloudapp.azure.com/api/chathub")
      .build();
    
    this._connection.start()
      .then(()=> console.log("Connection Established!!! c:"))
      .catch(err => console.log(err.message));

    this._connection.on("RecieveMessage", (user:string, message:string) => this.messages.push(`${user} : ${message}`));
  }

  Send(){
    this._connection.invoke("sendMessage", this.username, this.message);
  }
}
