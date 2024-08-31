let tests = [];
let globalId = 0;

function set(id, test) {
  tests[id] = {...test[id], test }
}

export function test(name, cb) {
  let test = tests[globalId++] = {
    name
  };

  cb({ skip: () => void test["skipped"] = true })
}

export { test as it };

export function expect(value) {
  let id = globalId;

  const current = tests[id];

  if (current.skipped) return;
  
  const assertion = {
    toBe: (target) => {
      const passed = target === value;
      set(id, { pass: passed, expected: target, received: value });
    }
  };

  return assertion;
}
