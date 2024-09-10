# yasumu-test

Testing framework for Yasumu

# Example

```ts
test("should have 200 status code", () => {
    expect(Yasumu.request.status).toBe(200);
});
```