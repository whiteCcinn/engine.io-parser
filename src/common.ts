export enum PacketType {
  OPEN,
  CLOSE,
  PING,
  PONG,
  MESSAGE,
  ERROR // only used upon parsing error
}

export type Data = string | Buffer | ArrayBuffer;

export interface IPacket {
  type: PacketType;
  data?: Data;
}

export interface IEncodedPayload {
  data: string | Buffer; // the concatenated data
  packetTypes: string; // the packet types, ex: "0,4,4"
  lengths: string; // the length (string) or bytelength (binary), example: "0,12,16"
}
