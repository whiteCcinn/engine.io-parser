import { Data, IEncodedPayload, IPacket, PacketType } from "./common";

const ERROR_PACKET: IPacket = { type: PacketType.ERROR };

const PACKET_TYPES_MAP: Map<string, PacketType> = new Map();

PACKET_TYPES_MAP.set("0", PacketType.OPEN);
PACKET_TYPES_MAP.set("1", PacketType.CLOSE);
PACKET_TYPES_MAP.set("2", PacketType.PING);
PACKET_TYPES_MAP.set("3", PacketType.PONG);
PACKET_TYPES_MAP.set("4", PacketType.MESSAGE);

/**
 * Decodes a single packet
 *
 * @param data
 * @param callback
 */
export function decodePacket(data: Data, callback: (packet: IPacket) => void) {
  if (typeof data === "string") {
    const type = PACKET_TYPES_MAP.get(data.charAt(0));
    if (type === undefined) {
      return callback(ERROR_PACKET);
    }
    return callback({
      data: data.length > 1 ? data.substr(1) : undefined,
      type
    });
  }
  return callback({ type: PacketType.MESSAGE, data });
}

/**
 * Decodes a list of packets
 *
 * @param payload the raw payload
 * @param callback may be called several times if the payload contains multiple packets
 */
export function decodePayload(
  payload: IEncodedPayload,
  callback: (packet: IPacket) => boolean
) {
  const packetTypes = payload.packetTypes.split(",");
  const lengths = payload.lengths.split(",");
  const isBinary = ArrayBuffer.isView(payload.data);
  if (packetTypes.length < 1 || packetTypes.length !== lengths.length) {
    return callback(ERROR_PACKET);
  }
  let offset = 0;
  for (let i = 0; i < packetTypes.length; i++) {
    const type = PACKET_TYPES_MAP.get(packetTypes[i]);
    const length = parseInt(lengths[i], 10);
    if (
      type === undefined ||
      isNaN(length) ||
      payload.data.length < offset + length
    ) {
      return callback(ERROR_PACKET);
    }
    const wantMore = callback({
      data:
        length === 0
          ? undefined
          : isBinary
          ? (payload.data as Buffer).slice(offset, offset + length)
          : (payload.data as string).substring(offset, offset + length),
      type
    });
    if (!wantMore) {
      return;
    }
    offset += length;
  }
}
