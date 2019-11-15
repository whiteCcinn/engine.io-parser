import { PacketType } from "./common";
import { encodePacket, encodePayload } from "./encode";

describe("encodePacket", () => {
  test("open", done => {
    encodePacket({ type: PacketType.OPEN }, data => {
      expect(data).toBe("0");
      done();
    });
  });

  test("close", done => {
    encodePacket({ type: PacketType.CLOSE }, data => {
      expect(data).toBe("1");
      done();
    });
  });

  test("ping", done => {
    encodePacket({ type: PacketType.PING }, data => {
      expect(data).toBe("2");
      done();
    });
  });

  test("pong", done => {
    encodePacket({ type: PacketType.PONG }, data => {
      expect(data).toBe("3");
      done();
    });
  });

  test("message (string)", done => {
    encodePacket({ type: PacketType.MESSAGE, data: "hello" }, data => {
      expect(data).toBe("4hello");
      done();
    });
  });

  test("message (buffer)", done => {
    encodePacket(
      { type: PacketType.MESSAGE, data: Buffer.from([1, 2, 3]) },
      data => {
        expect(data).toEqual(Buffer.from([1, 2, 3]));
        done();
      }
    );
  });

  test("message (arraybuffer)", done => {
    encodePacket(
      { type: PacketType.MESSAGE, data: Uint8Array.of(1, 2, 3) },
      data => {
        expect(data).toEqual(Uint8Array.of(1, 2, 3));
        done();
      }
    );
  });

  test("invalid packet", done => {
    try {
      encodePacket(
        { type: PacketType.OPEN, data: Buffer.from([1, 2, 3]) },
        () => {
          done(new Error("invalid packet"));
        }
      );
    } catch (e) {
      done();
    }
  });
});

describe("encodePayload", () => {
  test("one ping packet", done => {
    encodePayload([{ type: PacketType.PING }], payload => {
      expect(payload.data).toBe("");
      expect(payload.packetTypes).toBe("2");
      expect(payload.lengths).toBe("0");
      done();
    });
  });

  test("one message packet", done => {
    encodePayload([{ type: PacketType.MESSAGE, data: "hello 亜" }], payload => {
      expect(payload.data).toBe("hello 亜");
      expect(payload.packetTypes).toBe("4");
      expect(payload.lengths).toBe("7");
      done();
    });
  });

  test("multiple packets (string only)", done => {
    encodePayload(
      [
        { type: PacketType.OPEN },
        { type: PacketType.PING },
        { type: PacketType.MESSAGE, data: "hello 亜" },
        { type: PacketType.MESSAGE, data: "hello €" }
      ],
      payload => {
        expect(payload.data).toBe("hello 亜hello €");
        expect(payload.packetTypes).toBe("0,2,4,4");
        expect(payload.lengths).toBe("0,0,7,7");
        done();
      }
    );
  });

  test("multiple packets (buffer only)", done => {
    encodePayload(
      [
        { type: PacketType.MESSAGE, data: Buffer.from([1, 2, 3]) },
        { type: PacketType.MESSAGE, data: Buffer.from([4, 5, 6]) }
      ],
      payload => {
        expect(payload.data).toEqual(Buffer.from([1, 2, 3, 4, 5, 6]));
        expect(payload.packetTypes).toBe("4,4");
        expect(payload.lengths).toBe("3,3");
        done();
      }
    );
  });

  test("multiple packets (with string, buffer and arraybuffer)", done => {
    let n = 0;
    encodePayload(
      [
        { type: PacketType.OPEN },
        { type: PacketType.PING },
        { type: PacketType.MESSAGE, data: "hello 亜" },
        { type: PacketType.MESSAGE, data: Buffer.from([1, 2, 3]) },
        { type: PacketType.MESSAGE, data: Uint8Array.of(4, 5, 6) },
        { type: PacketType.MESSAGE, data: "hello €" }
      ],
      payload => {
        if (n === 0) {
          expect(payload.data).toBe("hello 亜");
          expect(payload.packetTypes).toBe("0,2,4");
          expect(payload.lengths).toBe("0,0,7");
          n++;
        } else if (n === 1) {
          expect(payload.data).toEqual(Buffer.from([1, 2, 3, 4, 5, 6]));
          expect(payload.packetTypes).toBe("4,4");
          expect(payload.lengths).toBe("3,3");
          n++;
        } else {
          expect(payload.data).toBe("hello €");
          expect(payload.packetTypes).toBe("4");
          expect(payload.lengths).toBe("7");
          done();
        }
      }
    );
  });
});
