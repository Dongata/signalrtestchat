import { Component, Input, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import * as SignalR from '@aspnet/signalr'
import { OAuthService } from 'angular-oauth2-oidc';

interface Issue {
  id: string;
  messages: MessageResponse[];
}

interface MessageResponse {
  id: string;
  recieverId: string;
  senderId: string;
  wasReaded: string;
  sendedOn: string;
  readedOn: string;
  contents: MessageContent[];
}

interface MessageContent {
  type: string;
  payload: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  //private url:string = "https://nginxv2.southcentralus.cloudapp.azure.com/api/chathub";
  private _token: string = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI0OTEwM2Q3YTA2N2EyODdhZjU0NDFkZjUxMDZhNzUwIiwidHlwIjoiSldUIn0.eyJuYmYiOjE1NDI5OTYwMDgsImV4cCI6MTU0Mjk5OTYwOCwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NTAwMiIsImF1ZCI6WyJodHRwczovL2xvY2FsaG9zdDo1MDAyL3Jlc291cmNlcyIsIkdyb3dlclBvcnRhbCJdLCJjbGllbnRfaWQiOiJuYXRpdmUuY2xpZW50MSIsInN1YiI6IjQ3OTcxODg5LWZjODQtNGNjZC1hMGIyLTM2N2M1MGM1MjgyZiIsImF1dGhfdGltZSI6MTU0Mjk5NjAwOCwiaWRwIjoibG9jYWwiLCJuaWNrbmFtZSI6ImdjZXJpb25pMjEiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJnY2VyaW9uaTIxIiwiZW1haWwiOiJnY2VyaW9uaTJAZ29pYXIuY29tIiwiZ2l2ZW5fbmFtZSI6Imdhc3RvbjIxIiwiZmFtaWx5X25hbWUiOiJjZXJpb25pMjEiLCJyb2xlIjoiR3Jvd2VyIiwic2NvcGUiOlsiYXBpUHJvZmlsZSIsImVtYWlsIiwib3BlbmlkIiwicHJvZmlsZSIsInJvbGVzIiwiR3Jvd2VyUG9ydGFsIl0sImFtciI6WyJjdXN0b20iXX0.EY9xsckSnGf1L90hpfTukFxriCJbLx6IY8t4hYd6Ad9gO4tNXUemnexNvDLcH_p1TEdpZoJkq6Ds9lOpYOAduMATnwNNWtIQa85yCbNqgDjtW5w2yYcSa-hAl9wI8tktYhFAshwsbfiPcqM9P7AZnRRjH2w80U0BE5cE9PXkLEwmiO-gYOAcufjs0pPiOdrNKfkMkFOOXV3TAzTu37-o5uOU7U6NA29H7oe2oluCLzgcKduZSmCyzDeIZcKLQJQzWCEuegjHm02XtbH0nwddK5LGeKCxgd4vRADfHtK7-k_8ddwaggSHMdGK-bLZ4zcAAHynfUprFtMG-k8PdAKgPQ";
  private _url: string = "http://localhost:5000/chathub";
  private _connection: SignalR.HubConnection;

  title = 'signalrtest';
  @Input() username: string;
  @Input() password: string;
  @Input() message: string;
  userId: string;
  isAuthenticated: boolean = false;
  messages: MessageContent[] = [];
  issueId: string;

  constructor(private _httpclient: HttpClient, private oidcService: OAuthService) {
    this.oidcService.clientId = 'native.client1';
    this.oidcService.scope = 'openid profile roles email apiProfile GrowerPortal';
    this.oidcService.setStorage(sessionStorage);
    this.oidcService.dummyClientSecret = 'ApiSecret';
    this.oidcService.issuer = "http://localhost:5003";
    this.oidcService.oidc = false;
    this.oidcService.loadDiscoveryDocument('http://localhost:5003/.well-known/openid-configuration').then(() => { })
  }

  ngOnInit(): void {
  }

  authenticate() {
    this.oidcService.fetchTokenUsingPasswordFlow(this.username, this.password).then((resp: any) => {
      this._token = resp.access_token;

      // Loading data about the user
      return this.oidcService.loadUserProfile();
    }).then(() => {
      let claims: any = this.oidcService.getIdentityClaims();
      this.userId = claims.sub;
      this.isAuthenticated = true;
      this.startConnection();
    });
  }

  startConnection() {
    this._httpclient.get(
      'http://localhost:5000/issue',
      { headers: new HttpHeaders().set("Authorization", "Bearer " + this._token) })
      .subscribe((s: Issue[]) => {
        this.issueId = s[0].id;
        this.messages = s[0].messages
          .map(s => s.contents)
          .reduce((a, d) => a.concat(d))
          .map(a=>
            {
              if(a.type.toLowerCase()==='image')
              {
                a.payload = "data:image/png;base64," + a.payload;
              }
              return a;
            });
      });

    this._connection = new SignalR.HubConnectionBuilder()
      .withUrl(this._url, { accessTokenFactory: () => this._token })
      .build();

    this._connection.start()
      .then(() => console.log("Connection Established!!! c:"))
      .catch(err => console.log(err.message));

    this._connection.on("RecieveMessage", (issueId: string, message: MessageContent[]) =>
      message.forEach(m => this.messages.push(m)));
  }

  Send() {
    let reciever: string;
    if (this.userId.toUpperCase() == 'E3F5D5E8-7F7F-464E-838C-0557960AB182')
      reciever = 'CC25C7D0-64F9-4463-9267-00052A0289F0';
    else
      reciever = 'E3F5D5E8-7F7F-464E-838C-0557960AB182';

    var message = { type: "string", payload: this.message };

    this._connection.invoke(
      "sendMessage",
      reciever,
      this.issueId,
      [message]
    );

    this.messages.push(message);
    this.message = '';
  }
}
