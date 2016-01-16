///<reference path="../typings/mocha/mocha.d.ts" />
///<reference path="../typings/chai/chai.d.ts" />
///<reference path="../typings/expect.js/expect.js.d.ts" />

var XMLHttpRequest = require('../dist/XMLHttpRequest').XMLHttpRequest;
var expect = require('expect.js');
//var assert = require('assert');
var chai = require('chai');
//var should = require('should');

var server = require("./test-server");

server.use("/abort1", function(req,res,next){
    res.status(200).send("foo");
});


server.use("/abort2", function(req,res,next){
    setTimeout(function(){
        res.status(200).send("FOOOOBARRRR");
    });
});

var host = "http://localhost:1337";

describe('XMLHttpRequest', function () {
    it('abort() after successful receive should not fire "abort" event', function (done) {
        var client = new XMLHttpRequest();
        client.onreadystatechange = function () {
            if (client.readyState == 4) {
                // abort should not cause the "abort" event to fire
                client.abort();
                
                expect(client.readyState).to.be(0,'Readystate should be 0');
               
                setTimeout(done, 200);
            }
        };

        client.onabort = function () {
            throw new Error('abort() should not cause the abort event to fire');
            done();
        };
        client.open("GET", host+"/abort1", true);
        client.send(null);

    });
    
    it('abort() after send()', function (done) {
            var client = new XMLHttpRequest(),
            control_flag = false,
            result = [],
            expected = [1, 4, 'progress', 'abort', 'loadend'] // open() -> 1, abort() -> 4
            client.onreadystatechange = function() {
               
            result.push(client.readyState)
            if(client.readyState == 4) {
              control_flag = true
              
              expect(client.responseXML,"responseXML").to.be(null);
              expect(client.responseText,"responseText").to.be("","responseText");
              expect(client.status,"status").to.be(0);
              expect(client.statusText,"statusText").to.be("");
              expect(client.getAllResponseHeaders(), "getAllResponseHeaders").to.be("");
              expect(client.getResponseHeader('Content-Type'), "getResponseHeader").to.be(null);
          
              setTimeout(function(){
                expect(control_flag,"control_flag").to.be.ok();
                expect(client.readyState,"readyState").to.be(0);
                expect(result,"result").to.eql(expected);
                
              done();
              },500);
            } else if(client.readyState == 3){
               
            }
          
        };
        
         client.open("GET", host+'/abort2');
        client.addEventListener('progress', logEvt);
        client.addEventListener('abort', logEvt);
        client.addEventListener('loadend', logEvt);
        
        client.send(null);
      
         client.abort();
        
      
        
         function logEvt (e) {
       
          result.push(e.type)
        }
       

    });
    it('abort event should fire when stop() method is used');
    it('abort() after a timeout should not fire "abort" event');
    it('abort() during DONE');


});


/*
describe('test', function(){
    it("TEST123", function(done){
        
        assert.throws()
        done();
    });
    
})*/