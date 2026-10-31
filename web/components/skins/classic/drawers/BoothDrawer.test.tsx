import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BoothDrawer from './BoothDrawer';
import type { SessionTurn } from '@/lib/types';

const voice: SessionTurn = {
  t: '2026-10-07T22:45:00Z', role: 'segment', kind: 'link', text: 'An outgoing line.',
  meta: { carried: true, personaName: 'Outgoing Bob' },
};

const render = (items: SessionTurn[]) => renderToStaticMarkup(createElement(BoothDrawer, {
  items, timezone: 'UTC', locale: 'en-GB',
}));

test('carried speech shows its outgoing speaker and stays dimmed', () => {
  const html = render([voice]);
  assert.match(html, /Outgoing Bob/);
  assert.match(html, /An outgoing line/);
  assert.match(html, /opacity:0\.6/);
});

test('ordinary speech and carried tracks keep their existing presentation', () => {
  assert.doesNotMatch(render([{ ...voice, meta: { personaName: 'Live Mae' } }]), /Live Mae/);
  assert.doesNotMatch(render([{ ...voice, role: 'track' }]), /Outgoing Bob/);
});

test('a named human requester uses the same accent label treatment as DJ speech', () => {
  const trackHtml = render([{
    t: '2026-10-07T22:46:00Z',
    role: 'track',
    kind: 'play',
    text: 'Radio Friendly Unit Shifter by Nirvana',
    meta: { requestedBy: 'Z Man', source: 'request' },
  }]);
  const acknowledgementHtml = render([{
    t: '2026-10-07T22:45:30Z',
    role: 'dj',
    kind: 'request',
    text: 'Coming up for you, Z Man.',
    meta: { requester: 'Z Man' },
  }]);

  assert.match(
    trackHtml,
    /<span class="font-semibold tracking-\[0\.3em\] text-vermilion">req by Z Man<\/span>/,
  );
  assert.match(trackHtml, /req by Z Man<\/span> · source: request/);
  assert.match(
    acknowledgementHtml,
    /<span class="font-semibold tracking-\[0\.3em\] text-vermilion">req by Z Man<\/span>/,
  );
});

test('anonymous and non-listener requesters keep the muted metadata treatment', () => {
  const anonymous = render([{
    role: 'track', kind: 'play', text: 'Anonymous request',
    meta: { requestedBy: 'anon', source: 'request' },
  }]);
  const studio = render([{
    role: 'track', kind: 'play', text: 'Operator queue',
    meta: { requestedBy: 'studio', source: 'operator' },
  }]);

  assert.doesNotMatch(anonymous, /text-vermilion">req by anon/);
  assert.doesNotMatch(studio, /text-vermilion">req by studio/);
});
