// import Long from 'long';
// import $ from 'jquery';
// import io from 'socket.io-client';
// import protobuf from 'protobufjs';
// import SVG from 'svg.js';

// import getAll from './src/all';
// import {getDatByPath, GetQueryString, getUniqueId} from './src/utils';

// var all = getAll();
// var headerUrlRest = "http://turn2.easemob.com:8031";
// var headerUrlSock = "http://turn2.easemob.com:8900";
// protobuf.util.Long = Long;
// protobuf.configure();
// var root = protobuf.Root.fromJSON(all);
// var messageCache = {};

// var indexPage = 0;
// var roomId = GetQueryString("roomId");
// var userId = GetQueryString("userId");
// var token = GetQueryString("token");
// var socketIOPath = GetQueryString("socketIOPath");
// headerUrlSock = GetQueryString("socketIOUrl");
import InitMainView from './src/main'
SVG.on(document, 'DOMContentLoaded', InitMainView)
