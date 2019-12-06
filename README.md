# Better Redux Tests

This repository contains my take on how to test Redux applications.

It contains the source code related to this article in my blog:  
[A better approach for testing your Redux code](https://blog.henriquebarcelos.dev/a-better-approach-for-testing-your-redux-code-ck3dnpqnu00uro4s178b8aw3e)

## TL;DR

A few thoughts about how to approach Redux testing:

### Vanilla Redux

- The smallest standalone unit in Redux is the entire state slice. Unit tests should interact with it as a whole.
- There is no point in testing reducers, action creators and selectors in isolation. As they are tightly coupled with each other, isolation gives us little to no value.
- Tests should interact with your redux slice same way your application will.
    - Always use action creators to dispatch actions.
    - Always use selectors to read from the state when performing assertions. 
    - By doing that, you will be able to catch errors in both your action creators and selectors, without having to write tests targeting them in isolation.
- Avoid assertions like `toEqual`/`toDeepEqual` against the state object, as they create a coupling between your tests and the state structure.
    - Moving state around is quite common in Redux applications. By avoiding this kind of coupling you save yourself from a maintenance nightmare.
- Using selectors gives you the granularity you need to run simple assertions.
    - If a given piece of state is not touched after an action is dispatched, you don't need to reference it in your test.
- Selectors and action creators should be boring, so they won't require testing.
    - If you need something more elaborate, see if [`reselect`](https://github.com/reduxjs/reselect) can help you with your selectors and if [`redux-act`](https://github.com/pauldijou/redux-act) or [`@reduxjs/toolkit`](https://redux-toolkit.js.org/) can ease the pain when creting actions before adding complexity by yourself.
- Your slice is somewhat equivalent to a pure function, which means you don't need any mocking facilities in order to test it.

### Redux + `redux-thunk`

- Dispatching thunks doesn't have any direct effect. Only after the thunk is called is when we will have the side-effects we need to make our application work.
- Here you can use stubs, spies and sometimes mocks (but [don't abuse mocks](https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a)).
- Because of the way thunks are structured, the only way to test them is by testing their implementation details.
    - The downside to this is that your tests are more coupled with your code, so it will be harder to maintain.
- The strategy when testing thunks is to setup the store, dispatch the thunk and then asserting whether it dispatched the actions you expected in the order you expected or not.

## Using This Repo

### Structure

Here's how this repo is structured:

```
src
├── api
│   └── index.js
└── modules
    ├── auth
    │   ├── authSlice.js
    │   └── authSlice.test.js
    └── documents
        ├── documentsSlice.js
        └── documentsSlice.test.js
```

The `auth` module is very simple, making it easier to fammiliarize yourself with the ideas discussed here.

The `documents` module looks more like a "real world" application, which makes it a little trickier to test, but the same ideas apply.

### Running the Tests

First, don't forget to install the dependencies:

```bash
yarn install
```

Then run:

```
yarn test --verbose
```
