ActorJs
=======
_If you want to learn about the actor model, then [Akka](http://akka.io/) is a good place to start._

ActorJs is meant to be a fairly full-fledged actor model that runs in both the browser and on the server.  It was originally started as a fork of [NActor](https://github.com/benlau/nactor), but has since grown into its own codebase.  It was re-designed from the ground up with no NActor code in here.  NActor is a great little project, though, and I encourage you to check it out.

The original fork of NActor from which this code was pulled, can be found at [https://github.com/JediMindtrick/rNr](https://github.com/JediMindtrick/rNr).

Description
-----------

There are a couple of js/nodejs based actor libraries out there, few if any, of which implement the following features:

1.  Basic Supervision
2.  Hot-swapping of actor implementations
3.  Location transparency of remote actors

This is too bad, as these are some of the features that make the actor model so powerful.  So basically, I've had this itch for awhile and a few weeks ago decided to go ahead and scratch it :)

This is a learning/exploratory project for me and at present should not be considered fit for production, although feedback is certainly welcome.

In terms of design/implementation here are some general tools and guidelines I will attempt to follow:

1. Written in ES6, transpiled with babel
2. Unit tested and linted with chai and eslint
3. Inspired by Erlang and Akka, but not aspiring to be a port of either
4. Deterministic processing of messages
5. Functional programming techniques and constructs will be used as often as appropriate*

*Ironically, actors themselves are pretty darn stateful.

Build & Dev
-----------
```
npm install -g babel
npm install -g eslint
npm install -g babel-eslint
npm install -g nodemon
npm run dev
```

Using [babel](https://babeljs.io/) & [eslint](http://eslint.org/docs/user-guide/configuring) for linting and transpiling.

Resources
---------
[Here's a good tutorial on using eslint](https://medium.com/@dan_abramov/lint-like-it-s-2015-6987d44c5b48)

License
-------
MIT
