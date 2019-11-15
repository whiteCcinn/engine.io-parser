import { PacketType } from "./common";
import { decodePacket, decodePayload } from "./decode";

describe("decodePacket", () => {
  test("open", done => {
    decodePacket("0", packet => {
      expect(packet).toEqual({ type: PacketType.OPEN });
      done();
    });
  });

  test("close", done => {
    decodePacket("1", packet => {
      expect(packet).toEqual({ type: PacketType.CLOSE });
      done();
    });
  });

  test("ping", done => {
    decodePacket("2", packet => {
      expect(packet).toEqual({ type: PacketType.PING });
      done();
    });
  });

  test("pong", done => {
    decodePacket("3", packet => {
      expect(packet).toEqual({ type: PacketType.PONG });
      done();
    });
  });

  test("message (string)", done => {
    decodePacket("4hello", packet => {
      expect(packet).toEqual({ type: PacketType.MESSAGE, data: "hello" });
      done();
    });
  });

  test("message (buffer)", done => {
    decodePacket(Buffer.from([1, 2, 3]), packet => {
      expect(packet).toEqual({
        data: Buffer.from([1, 2, 3]),
        type: PacketType.MESSAGE
      });
      done();
    });
  });

  test("empty packet", done => {
    decodePacket("", packet => {
      expect(packet).toEqual({
        type: PacketType.ERROR
      });
      done();
    });
  });

  test("invalid type", done => {
    decodePacket("6hello", packet => {
      expect(packet).toEqual({
        type: PacketType.ERROR
      });
      done();
    });
  });
});

describe("decodePayload", () => {
  test("one ping packet", done => {
    decodePayload(
      {
        data: "",
        lengths: "0",
        packetTypes: "2"
      },
      packet => {
        expect(packet).toEqual({ type: PacketType.PING });
        done();
        return true;
      }
    );
  });

  test("one message packet", done => {
    decodePayload(
      {
        data: "hello 亜",
        lengths: "7",
        packetTypes: "4"
      },
      packet => {
        expect(packet).toEqual({ type: PacketType.MESSAGE, data: "hello 亜" });
        done();
        return true;
      }
    );
  });

  test("multiple packets (string only)", done => {
    let n = 0;
    decodePayload(
      {
        data: "hello 亜hello €",
        lengths: "0,0,7,7",
        packetTypes: "0,2,4,4"
      },
      packet => {
        if (n === 0) {
          expect(packet).toEqual({ type: PacketType.OPEN });
        } else if (n === 1) {
          expect(packet).toEqual({ type: PacketType.PING });
        } else if (n === 2) {
          expect(packet).toEqual({
            data: "hello 亜",
            type: PacketType.MESSAGE
          });
        } else if (n === 3) {
          expect(packet).toEqual({ type: PacketType.MESSAGE, data: "hello €" });
          done();
        }
        n++;
        return true;
      }
    );
  });

  test("multiple packets (buffer only)", done => {
    let n = 0;
    decodePayload(
      {
        data: Buffer.from([1, 2, 3, 4, 5, 6]),
        lengths: "3,3",
        packetTypes: "4,4"
      },
      packet => {
        if (n === 0) {
          expect(packet).toEqual({
            data: Buffer.from([1, 2, 3]),
            type: PacketType.MESSAGE
          });
        } else if (n === 1) {
          expect(packet).toEqual({
            data: Buffer.from([4, 5, 6]),
            type: PacketType.MESSAGE
          });
          done();
        }
        n++;
        return true;
      }
    );
  });

  test("one packet (invalid packetTypes)", done => {
    decodePayload(
      {
        data: "",
        lengths: "0",
        packetTypes: "2,4"
      },
      packet => {
        expect(packet).toEqual({ type: PacketType.ERROR });
        done();
        return true;
      }
    );
  });

  test("one packet (invalid length)", done => {
    decodePayload(
      {
        data: "",
        lengths: "a",
        packetTypes: "2"
      },
      packet => {
        expect(packet).toEqual({ type: PacketType.ERROR });
        done();
        return true;
      }
    );
  });

  test("multiple packets (consume only first)", done => {
    decodePayload(
      {
        data: "hello 亜hello €",
        lengths: "0,0,7,7",
        packetTypes: "0,2,4,4"
      },
      packet => {
        expect(packet).toEqual({ type: PacketType.OPEN });
        done();
        return false;
      }
    );
  });
});
