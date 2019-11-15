import { Data, IEncodedPayload, IPacket, PacketType } from "./common";

/**
 * Encodes a single packet
 *
 * @param packet
 * @param callback
 */
export function encodePacket(
  packet: IPacket,
  callback: (data: Data) => void
): void {
  if (packet.data === undefined) {
    return callback("" + packet.type);
  } else if (typeof packet.data === "string") {
    return callback("" + packet.type + packet.data);
  } else if (packet.type === PacketType.MESSAGE) {
    return callback(packet.data); // noop, as only MESSAGE packets can contain binary data
  } else {
    throw new Error("invalid packet");
  }
}

/**
 * Encodes a list of packets
 *
 * @param packets
 * @param callback may be called several times if the list contains both non-binary and binary content
 */
export function encodePayload(
  packets: IPacket[],
  callback: (data: IEncodedPayload) => void
): void {
  let toConcat: Array<string | Buffer> = [];
  let packetTypes: PacketType[] = [];
  let lengths: number[] = [];

  let isCurrentlyBinary = ArrayBuffer.isView(packets[0].data);

  for (const packet of packets) {
    const isBinary = ArrayBuffer.isView(packet.data);
    if (isCurrentlyBinary !== isBinary) {
      callback({
        data: isCurrentlyBinary
          ? Buffer.concat(toConcat as Buffer[])
          : toConcat.join(""),
        lengths: lengths.join(","),
        packetTypes: packetTypes.join(",")
      });
      toConcat = [];
      packetTypes = [];
      lengths = [];
    }
    isCurrentlyBinary = isBinary;
    packetTypes.push(packet.type);
    if (packet.data === undefined) {
      lengths.push(0);
    } else if (typeof packet.data === "string") {
      lengths.push(packet.data.length);
      toConcat.push(packet.data);
    } else {
      lengths.push(packet.data.byteLength);
      if (Buffer.isBuffer(packet.data)) {
        toConcat.push(packet.data);
      } else {
        toConcat.push(Buffer.from(packet.data));
      }
    }
  }
  if (packetTypes.length > 0) {
    callback({
      data: isCurrentlyBinary
        ? Buffer.concat(toConcat as Buffer[])
        : toConcat.join(""),
      lengths: lengths.join(","),
      packetTypes: packetTypes.join(",")
    });
  }
}
