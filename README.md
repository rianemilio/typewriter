# Typewriter login

A login form typed on a vintage typewriter. The machine types the form header,
you type your login and password on the sheet, and the result comes down as a
rubber stamp: **DENIED** feeds the paper up for another attempt, **ACCESS GRANTED**
lets you eject the sheet and start over.

Built with React 18, TypeScript, Vite and SCSS modules. Every visual is CSS
gradients, shadows and inline SVG, and every sound is synthesized with the Web
Audio API. There are no image or audio assets.

## Running

Requires Node 20.19+ (or 22.12+).

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build into dist/
npm run preview  # serve the production build
```

Demo credentials: `typist` / `carbon` (also written on the card on the desk).

## Plugging in a real authentication API

All credential checking lives in [`src/services/auth.ts`](src/services/auth.ts):

```ts
export async function login(username: string, password: string): Promise<boolean>
```

Replace its body with a request to your backend and resolve to `true` or
`false`. Nothing else needs to change: the typewriter already awaits this
promise while the carriage sits at the bottom of the form, then stamps the
result. A rejected promise (network error, 500…) is stamped as DENIED.

Once real credentials are in place, remove the credentials card from
`src/components/Desk/Desk.tsx`.

## How it is organized

```
src/
  App.tsx                     <Desk> with <Typewriter> inside
  components/
    Desk/                     background, lamp light, vignette, credentials card, sound toggle
    Typewriter/
      Typewriter.tsx          composes the parts, wires input and sounds
      machine.ts              state, actions, reducer, sheet geometry
      sequences.ts            automatic typing / stamping for each phase
      useMachine.ts           useReducer with a synchronous state mirror
    Carriage/                 roller, knobs, bail, lever; slides horizontally
    Paper/                    the sheet, typed lines and stamps; feeds vertically
    Stamp/                    stamp impression and the worn-ink SVG filter
    ReturnKey/                the mechanical Return / New sheet key
  hooks/
    useTypewriterSound.ts     Web Audio synthesis and the on/off toggle
    useHiddenInput.ts         invisible input that captures keystrokes (mobile keyboards included)
  services/auth.ts
  styles/                     tokens, material mixins, keyframes, global styles
```

The flow is an explicit state machine:

```
intro → typingLogin → typingPassword → validating ─┬→ denied → typingLogin …
                                                   └→ granted → ejecting → intro
```

Each phase can start an automatic sequence (see `sequences.ts`). Sequences run in
an effect with an `AbortController`, so they stop cleanly on unmount and under
React StrictMode. Keystrokes are ignored while a sequence is running.

The sheet is plain data: lines of characters, each with ink variation (offset,
tilt, opacity) rolled when it is typed, plus a list of stamps. Carriage and paper
positions are derived from the current column and line.

## Inspiration

Inspired by [this video](https://youtu.be/-LMhNfYPLP0).
