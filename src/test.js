import { expect, test } from './index.js'

test("addition", () => {
    expect(2 + 2).toBe(4);
});

test("subtraction", () => {
    expect(2 + 2).toBe(0);
})

test("multiplication", (t) => {
    t.skip();
});

test("division", () => {
    expect(2 / 2).toBe(1);
})
