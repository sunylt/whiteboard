import protobuf from 'protobufjs';
import getAll from '../all';
var all = getAll();
var root = protobuf.Root.fromJSON(all);

export default function formEMFrame(buff){

	// var emptyMessage = [];
	var unit8 = new Uint8Array(buff);

	var EMFrame = root.lookup("protobuf.EMFrame");
	var EMFrameMessage = EMFrame.decode(unit8);

	return EMFrameMessage;
}