let tests = [];
let globalId = 0;

export function test(name, cb) {
    let test = {
        name
    };

    tests[globalId++] = test;

    cb({ skip: () => void (test["skipped"] = true) })

    if (test.skipped) {
        return console.log(yellow(`${test.name} - Skipped\n`));
    }

    if (test.test.pass) {
        return console.log(green(`${test.name} - Passed\n`));
    } else {
        return console.error(red(`${test.name} - Failed\n- Expected: ${test.test.expected}\n+ Received: ${test.test.received}\n`));
    }
}

export { test as it };

export function expect(value) {
    let id = globalId - 1;

    const current = tests[id];

    if (current.skipped) return;

    const assertion = {
        toBe: (target) => {
            const passed = target === value;
            Object.assign(current, { test: { pass: passed, expected: target, received: value } });
        }
    };

    return assertion;
}
