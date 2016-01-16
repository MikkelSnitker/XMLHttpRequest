var XMLHttpRequest = require("./dist/XMLHttpRequest").XMLHttpRequest;

function log(type){
    console.log(type);
}

var xhr = new XMLHttpRequest();
xhr.onreadystatechange=function(){
  console.log("READYSTATE", xhr.readyState);  
  if(xhr.readyState == XMLHttpRequest.HEADERS_RECEIVED){
      console.log("CONTENT:",xhr.getResponseHeader("content-type"));
  }
};
//xhr.responseType="json";
xhr.onloadstart = log.bind(console, "LOADSTART");

xhr.onprogress = log.bind(console, "PROGRESS");
xhr.onload = log.bind(console, "LOAD");
xhr.ontimeout = log.bind(console, "TIMEOUT");
xhr.onabort = log.bind(console, "ABORT");
xhr.onerror = log.bind(console, "ERROR");
xhr.onloadend = function(){
    
   console.log("RESPONSE:", xhr.response);
    
};
xhr.open("GET", "http://cposdev1.northeurope.cloudapp.azure.com:5984/spottd/_design/users/_view/all");
xhr.send();

