import { regressionScript, markdownReport } from './export.js';
const $ = selector => document.querySelector(selector);
const state = { ready: false, busy: false, ticket: null, artifact: null, evidence: [], events: [], seen: new Set(), stream: null, imported: false, policy: 'cooperative', transport: 'event-source', streamAbort: null, generation: 0 };
const cents = value => `${Number(value).toLocaleString('en-US')}¢`;
const text = (selector, value) => { $(selector).textContent = value; };
function element(tag, value, className) { const node = document.createElement(tag); if (value !== undefined) node.textContent = value; if (className) node.className = className; return node; }
function notice(value, kind = '') { text('#connection', value); $('#connection').className = `notice ${kind}`; }
async function request(path, payload) {
  const response = await fetch(path, payload === undefined ? undefined : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Speculate': '1' }, body: JSON.stringify(payload) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error ?? `Request failed (${response.status}).`);
  return value;
}
function controls() {
  $('#start').disabled = !state.ready || state.busy;
  $('#cancel').hidden = !state.busy;
  $('#import').disabled = state.busy;
  $('#open-recorded').disabled = state.busy;
  $('#open-demo').disabled = state.busy;
  for (const input of $('#run-form').querySelectorAll('input,select')) input.disabled = state.busy;
}
function reset() {
  $('#download-area').replaceChildren(); $('#download-area').hidden = true;
  state.generation++; state.streamAbort?.abort(); state.streamAbort = null;
  state.stream?.close(); state.stream = null; state.artifact = null; state.evidence = []; state.events = []; state.seen.clear();
  $('#report-area').hidden = true; $('#revisions').replaceChildren(element('p', 'A revised action will appear here with the peer result that caused it.', 'empty-text'));
  $('#events').replaceChildren(); text('#event-count', '0'); text('#probe-count', '0 EXECUTED');
  text('#expected', '—'); text('#actual', '—'); text('#outcome', 'Awaiting a run'); $('#outcome').className = 'outcome-badge'; text('#run-time', 'No observations yet');
  text('#verification', 'The corrected fixture is prebuilt. Passing these cases does not prove every input is correct.');
  for (const id of ['pricing', 'tax']) { const card = $(`#${id}`); card.hidden = false; card.classList.remove('working'); card.querySelector('.agent-state').textContent = 'Waiting'; card.querySelector('.agent-latest').textContent = 'Waiting for an observed action.'; card.querySelector('.agent-progress span').style.width = '0%'; }
  $('#pricing h3').textContent = 'Pricing'; $('#pricing .agent-description').textContent = 'Investigates quantity, discounts, and rounding.';
  renderEvidence();
}
function renderEvidence() {
  const tbody = $('#evidence'); tbody.replaceChildren();
  if (!state.evidence.length) { const row = element('tr'); const cell = element('td', 'Executed quote results will appear here. Agent explanations are shown separately.', 'table-empty'); cell.colSpan = 5; row.append(cell); tbody.append(row); return; }
  for (const evidence of state.evidence) {
    const row = element('tr'); row.title = `${evidence.purpose}\n${JSON.stringify(evidence.input)}\nEvidence: ${evidence.id}`;
    row.append(element('td', `#${evidence.revision}`), element('td', evidence.agentId), element('td', cents(evidence.expectedCents)), element('td', cents(evidence.actualCents)));
    const outcome = element('td'); outcome.append(element('span', evidence.passed ? 'PASS' : 'FAIL', `badge ${evidence.passed ? 'pass' : 'fail'}`)); row.append(outcome); tbody.append(row);
  }
  const first = state.evidence[0]; text('#expected', cents(first.expectedCents)); text('#actual', cents(first.actualCents));
  text('#outcome', first.passed ? 'Contract passes' : 'Regression reproduced'); $('#outcome').className = `outcome-badge ${first.passed ? 'pass' : 'fail'}`;
  text('#probe-count', `${state.evidence.length} OBSERVED`);
}
function addRevision(event) {
  const area = $('#revisions'); area.querySelector('.empty-text')?.remove();
  const item = element('article', undefined, 'revision');
  item.append(element('strong', `${event.agentId}: ${event.data.changed ? 'changed the next action' : 'reviewed and kept the action'}`));
  const peers = Array.isArray(event.data.peerEvidenceIds) ? event.data.peerEvidenceIds.map(id => { const evidence = state.evidence.find(e => e.id === id); return evidence ? `probe #${evidence.revision} from ${evidence.agentId}` : String(id); }).join(', ') : 'Unknown evidence';
  item.append(element('p', `After ${peers}.`));
  const detail = element('details'); detail.append(element('summary', 'Inspect the proposed action before and after'));
  detail.append(element('pre', JSON.stringify({ before: event.data.before, after: event.data.after, peerEvidenceIds: event.data.peerEvidenceIds }, null, 2))); item.append(detail); area.append(item);
}
function appendEvent(event) {
  if (!event || !Number.isInteger(event.sequence) || state.seen.has(event.sequence)) return;
  state.seen.add(event.sequence); state.events.push(event);
  text('#event-count', state.events.length.toLocaleString());
  const row = element('li', `${(event.elapsedMs / 1000).toFixed(2)}s  ${event.agentId ?? 'system'}  ${event.type}`); $('#events').append(row);
  if ($('#events').children.length > 500) $('#events').firstElementChild.remove();
  text('#run-time', `${(event.elapsedMs / 1000).toFixed(1)}s elapsed`);
  if (event.type === 'probe.completed' && event.data.evidence) { state.evidence.push(event.data.evidence); renderEvidence(); }
  if (event.type === 'action.reconsidered') addRevision(event);
  const id = event.agentId === 'generalist' ? (state.policy === 'single' ? 'pricing' : null) : event.agentId;
  const card = ['pricing', 'tax'].includes(id) ? $(`#${id}`) : null;
  if (card) {
    const labels = { 'agent.started': 'Investigating', 'model.requested': 'Reasoning', 'model.completed': 'Reasoning complete', 'probe.started': 'Executing a probe', 'probe.completed': 'Evidence recorded', 'probe.reused': 'Reusing peer evidence', 'action.reconsidered': 'Reconsidered next action', 'agent.completed': 'Finished', 'agent.failed': 'Incomplete' };
    if (labels[event.type]) {
      card.querySelector('.agent-state').textContent = labels[event.type];
      card.querySelector('.agent-latest').textContent = event.data.purpose ?? event.data.evidence?.purpose ?? (event.type === 'action.reconsidered' ? 'The before/after action and peer evidence are recorded below.' : labels[event.type]);
      const done = ['agent.completed', 'agent.failed'].includes(event.type); card.classList.toggle('working', state.busy && !done);
      card.querySelector('.agent-progress span').style.width = '100%';
    }
  }
}
function showArtifact(artifact, imported = false) {
  for (const [name, value] of Object.entries(artifact.configuration.failingInput)) $(`[name="${name}"]`).value = value;
  $('[name="fixture"]').value = artifact.configuration.fixture; $('[name="policy"]').value = artifact.configuration.policy;
  state.artifact = artifact; state.busy = false; state.imported = imported; state.stream?.close(); state.stream = null;
  state.evidence = artifact.evidence; renderEvidence();
  for (const card of document.querySelectorAll('.agent')) card.classList.remove('working');
  if (artifact.status !== 'completed') for (const card of document.querySelectorAll('.agent')) {
    if (!artifact.conclusions[card.id]) card.querySelector('.agent-state').textContent = 'Stopped';
  }
  text('#run-state', artifact.status.toUpperCase()); text('#probe-count', `${artifact.metrics.probeExecutions} EXECUTED`);
  text('#run-time', `${(artifact.metrics.elapsedMs / 1000).toFixed(1)}s total`);
  $('#report-area').hidden = false; $('#verify').disabled = !artifact.evidence.length || (state.transport !== 'post-stream' && (imported || !state.ticket));
  $('#export-regression').disabled = !artifact.evidence.length;
  const conclusions = $('#conclusions'); conclusions.replaceChildren();
  for (const [agent, conclusion] of Object.entries(artifact.conclusions)) {
    const card = element('article', undefined, 'conclusion'); card.append(element('h3', `${agent} · ${artifact.execution === 'test' ? 'controlled test conclusion' : 'model conclusion'}`), element('p', conclusion.summary));
    card.append(element('p', `Cites ${conclusion.evidenceIds.length} observation(s).`, 'fine'));
    if (conclusion.unresolved.length) card.append(element('p', `Unresolved: ${conclusion.unresolved.join('; ')}`, 'muted'));
    conclusions.append(card);
  }
  if (!Object.keys(artifact.conclusions).length) conclusions.append(element('p', 'No complete evidence-linked conclusion was recorded.', 'muted'));
  if (!artifact.events.some(event => event.type === 'action.reconsidered')) $('#revisions').replaceChildren(element('p', artifact.configuration.policy === 'single' ? 'Single investigator control: no peer interventions.' : 'No peer-triggered action reconsideration was recorded in this run.', 'empty-text'));
  const stats = $('#stats'); stats.replaceChildren();
  for (const value of [`${artifact.metrics.modelRequests} model requests`, `${artifact.metrics.probeReuses} reused results`, artifact.runtime?.usage ? `${artifact.runtime.usage.inputTokens} input / ${artifact.runtime.usage.outputTokens} output tokens` : 'Token usage unavailable', `${artifact.configuration.policy} policy`]) stats.append(element('span', value));
  const mode = imported ? (artifact.execution === 'test' ? 'Recorded · controlled test' : `Recorded run · ${artifact.status}`) : (artifact.execution === 'test' ? 'Controlled test' : `Live run · ${artifact.status}`);
  text('#mode', mode); $('#mode').className = `mode ${artifact.execution === 'test' ? 'test' : ''}`;
  if (artifact.error) notice(artifact.events.some(e => e.type === 'agent.failed' && e.data.status === 429)
    ? `The model provider reached its request limit. ${artifact.evidence.length} executed observations and the regression export remain available; no final diagnosis was recorded.`
    : `${artifact.error.message} Completed observations remain available.`, 'error');
  else notice(imported ? 'Recorded evidence loaded. No agents or model calls are running.' : 'Investigation finished. Export the evidence and regression check, then verify the same cases against the corrected fixture.', 'success');
  controls();
}
function configurePolicy(policy) {
  state.policy = policy;
  if (policy === 'single') { $('#tax').hidden = true; $('#pricing h3').textContent = 'Generalist'; $('#pricing .agent-description').textContent = 'One adaptive investigator with every available observation.'; }
}
async function startInvestigation(payload) {
  validateStartInput(payload);
  if (state.busy) throw new Error('An investigation is already running.');
  if (!state.ready) throw new Error('The model connection is not configured.');
  reset(); state.busy = true; state.imported = false; state.ticket = null; controls(); configurePolicy(payload.policy);
  text('#run-state', 'STARTING'); notice('Starting the checkout checks and investigators…');
  try {
    if (state.transport === 'post-stream') return await startHostedStream(payload);
    const started = await request('/api/run', payload); state.ticket = started.ticket;
    text('#mode', started.execution === 'test' ? 'Controlled test' : 'Live agents'); $('#mode').className = `mode ${started.execution === 'test' ? 'test' : 'live'}`;
    text('#run-state', 'RUNNING'); notice('Results below come from executed local HTTP probes. A current model request may finish before fresh evidence changes its next action.');
    const stream = new EventSource(`/api/run/${state.ticket}/events`); state.stream = stream;
    stream.addEventListener('trace', event => appendEvent(JSON.parse(event.data)));
    stream.addEventListener('complete', event => showArtifact(JSON.parse(event.data)));
    stream.addEventListener('failure', event => { stream.close(); state.busy = false; notice(JSON.parse(event.data).error, 'error'); controls(); });
    stream.onerror = () => { if (state.busy) notice('The event connection was interrupted. Reconnecting; the investigation may still be running.'); };
    return { ticket: state.ticket, state: 'running' };
  } catch (error) { state.busy = false; controls(); text('#run-state', 'UNAVAILABLE'); notice(error.message, 'error'); throw error; }
}
async function startHostedStream(payload) {
  const generation = state.generation;
  const abort = new AbortController(); state.streamAbort = abort;
  const response = await fetch('/api/investigate', { method: 'POST', signal: abort.signal,
    headers: { 'Content-Type': 'application/json', 'X-Speculate': '1', 'X-Speculate-Access': $('#access-code').value }, body: JSON.stringify(payload) });
  if (!response.ok) { const error = await response.json(); throw new Error(error.error ?? 'Investigation could not start.'); }
  if (!response.body) throw new Error('The server did not return an event stream.');
  text('#mode', 'Live agents'); $('#mode').className = 'mode live'; text('#run-state', 'RUNNING');
  notice('The hosted investigators are running. Observed probe results will appear as they arrive.');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let pending = '';
  const handle = block => {
    if (state.generation !== generation) return;
    const kind = /^event: (.+)$/m.exec(block)?.[1]; const raw = /^data: (.+)$/m.exec(block)?.[1];
    if (!raw) return; const data = JSON.parse(raw);
    if (kind === 'connected') state.ticket = data.ticket;
    else if (kind === 'trace') appendEvent(data);
    else if (kind === 'complete') showArtifact(data);
    else if (kind === 'failure') throw new Error(data.error ?? 'Investigation failed.');
  };
  void (async () => {
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        pending += decoder.decode(chunk.value, { stream: true });
        if (pending.length > 5_000_000) throw new Error('The event response exceeded its size limit.');
        let boundary;
        while ((boundary = pending.indexOf('\n\n')) >= 0) { const block = pending.slice(0, boundary); pending = pending.slice(boundary + 2); handle(block); }
      }
      if (state.generation === generation && !state.artifact) throw new Error('The connection ended before a final report arrived. Observed results remain below.');
    } catch (error) {
      if (state.generation !== generation) return;
      state.busy = false; text('#run-state', abort.signal.aborted ? 'STOPPED' : 'INCOMPLETE');
      notice(abort.signal.aborted ? 'Stopped waiting for this run. Observed results remain below; an in-flight provider call may finish.' : error.message, 'error');
      for (const card of document.querySelectorAll('.agent')) card.classList.remove('working'); controls();
    } finally { if (state.streamAbort === abort) state.streamAbort = null; reader.releaseLock(); }
  })();
  return { state: 'running', transport: 'post-stream' };
}
function validateStartInput(payload) {
  const bounds = { unitPriceCents: [0,1000000], quantity: [1,100], discountBps: [0,10000], taxBps: [0,10000] };
  if (!payload || !['cooperative','single','independent'].includes(payload.policy) || !['discount-twice','tax-twice','correct'].includes(payload.fixture)
    || !payload.failingInput || Object.keys(payload.failingInput).length !== 4 || Object.entries(bounds).some(([key,[min,max]]) => !Number.isSafeInteger(payload.failingInput[key]) || payload.failingInput[key] < min || payload.failingInput[key] > max)) throw new Error('Provide valid bounded integer quote inputs, a fixture, and a policy.');
  return payload;
}
$('#run-form').addEventListener('submit', event => {
  event.preventDefault(); const form = new FormData(event.currentTarget);
  const failingInput = Object.fromEntries(['unitPriceCents', 'quantity', 'discountBps', 'taxBps'].map(key => [key, Number(form.get(key))]));
  void startInvestigation({ failingInput, fixture: form.get('fixture'), policy: form.get('policy') }).catch(() => {});
});
$('#cancel').addEventListener('click', async () => { if (state.transport === 'post-stream') { state.streamAbort?.abort(); return; } try { await request(`/api/run/${state.ticket}/cancel`, {}); notice('Stop requested. Future actions are blocked; an in-flight provider request may still finish.'); } catch (error) { notice(error.message, 'error'); } });
$('#verify').addEventListener('click', async () => {
  const verifyingTicket = state.ticket;
  const generation = state.generation;
  $('#verify').disabled = true; text('#verification', 'Executing the saved cases against the prebuilt corrected fixture…');
  try { const result = state.transport === 'post-stream'
    ? await request('/api/verify', { evidence: state.artifact.evidence.map(e => ({ id: e.id, input: e.input })) })
    : await request(`/api/run/${verifyingTicket}/verify`, {});
    if (state.generation === generation) text('#verification', `${result.cases - result.failures}/${result.cases} saved cases pass on the prebuilt corrected fixture. No AI-generated fix is claimed.`); }
  catch (error) { if (state.generation === generation) text('#verification', error.message); }
  finally { if (state.generation === generation) $('#verify').disabled = false; }
});
function download(name, value, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const anchor = element('a', `Save ${name}`); anchor.href = url; anchor.download = name;
  const area = $('#download-area'); area.replaceChildren(element('span', 'Your file is ready. '), anchor); area.hidden = false;
  anchor.click();
  // Keep the explicit save link available when automatic downloading is unsupported.
  window.addEventListener('pagehide', () => URL.revokeObjectURL(url), { once: true });
}
$('#export-json').addEventListener('click', () => download('run.json', JSON.stringify(state.artifact, null, 2), 'application/json'));
$('#export-report').addEventListener('click', () => download('report.md', markdownReport(state.artifact)));
$('#export-regression').addEventListener('click', () => download('regression.mjs', regressionScript(state.artifact)));
function validateArtifact(value) {
  if (!value || value.schemaVersion !== 1 || typeof value.runId !== 'string' || !['live','test'].includes(value.execution)
    || !['completed','incomplete','cancelled'].includes(value.status) || !Array.isArray(value.evidence) || value.evidence.length > 100
    || !Array.isArray(value.events) || value.events.length > 10000 || !value.metrics || !value.configuration || !value.conclusions) throw new Error('This file is not a supported SPECULATE run.');
  validateStartInput({ fixture: value.configuration.fixture, policy: value.configuration.policy, failingInput: value.configuration.failingInput });
  for (const e of value.evidence) if (!e || typeof e.id !== 'string' || typeof e.purpose !== 'string' || !Number.isInteger(e.revision) || !Number.isSafeInteger(e.actualCents) || !Number.isSafeInteger(e.expectedCents) || typeof e.passed !== 'boolean') throw new Error('A recorded observation is malformed.');
  for (const e of value.events) if (!e || !Number.isInteger(e.sequence) || typeof e.elapsedMs !== 'number' || typeof e.type !== 'string' || !e.data) throw new Error('A recorded event is malformed.');
  for (const c of Object.values(value.conclusions)) if (!c || typeof c.summary !== 'string' || !Array.isArray(c.evidenceIds) || !Array.isArray(c.unresolved)) throw new Error('A recorded conclusion is malformed.');
  return value;
}
$('#open-recorded').addEventListener('click', () => $('#import').click());
function openArtifact(artifact) {
  reset(); state.ticket = null; configurePolicy(artifact.configuration.policy);
  for (const runEvent of artifact.events) appendEvent(runEvent);
  showArtifact(artifact, true);
}
$('#open-demo').addEventListener('click', async () => {
  try { openArtifact(validateArtifact(await request('/recordings/demo.json'))); }
  catch (error) { notice(error.message, 'error'); }
});
$('#import').addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    if (file.size > 5_000_000) throw new Error('Choose a run JSON file smaller than 5 MB.');
    const artifact = validateArtifact(JSON.parse(await file.text()));
    openArtifact(artifact);
  } catch (error) { notice(error.message, 'error'); }
  finally { event.target.value = ''; }
});
try {
  const config = await request('/api/config'); state.ready = config.ready; state.transport = config.transport ?? 'event-source';
  $('#access-label').hidden = !config.requiresAccessCode;
  const locationLabel = state.transport === 'post-stream' ? 'Hosted' : 'Local';
  text('#mode', config.recordedOnly ? 'Recorded viewer' : config.ready ? `${locationLabel} · ready` : `${locationLabel} · setup needed`);
  notice(config.ready ? `Ready to investigate with ${config.model}. The selected fault label is kept out of the agents’ context.` : (config.reason ?? 'Configure the model connection and restart the application.'));
} catch { text('#mode', 'Recorded viewer'); notice('The investigation service is unavailable. Open a saved run to inspect its evidence and export a regression check.'); }
controls();

// Page tools share the same validation, state and actions as the visible controls.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const register = tool => { try { Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch {} };
  register({ name: 'inspect_investigation', title: 'Inspect investigation', description: 'Read the current investigation status, observed evidence and recorded conclusions. Does not call a model.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute(input) { if (!input || Object.keys(input).length) throw new Error('No arguments expected.'); return { ready: state.ready, running: state.busy, recorded: state.imported, ticket: state.ticket, status: state.artifact?.status ?? 'not completed', evidence: state.evidence, conclusions: state.artifact?.conclusions ?? {} }; } });
  register({ name: 'start_investigation', title: 'Start investigation', description: 'Start a bounded investigation using the configured model provider. This makes paid model requests and updates the visible room while agents continue running.',
    inputSchema: { type: 'object', required: ['fixture','policy','failingInput'], additionalProperties: false, properties: {
      fixture: { type: 'string', enum: ['discount-twice','tax-twice','correct'] }, policy: { type: 'string', enum: ['cooperative','single','independent'] },
      failingInput: { type: 'object', required: ['unitPriceCents','quantity','discountBps','taxBps'], additionalProperties: false, properties: { unitPriceCents: { type: 'integer', minimum: 0, maximum: 1000000 }, quantity: { type: 'integer', minimum: 1, maximum: 100 }, discountBps: { type: 'integer', minimum: 0, maximum: 10000 }, taxBps: { type: 'integer', minimum: 0, maximum: 10000 } } } } },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    async execute(input) {
      const payload = validateStartInput(input);
      const result = await startInvestigation(payload);
      for (const [name,value] of Object.entries(payload.failingInput)) $(`[name="${name}"]`).value = value;
      $('[name="fixture"]').value = payload.fixture; $('[name="policy"]').value = payload.policy;
      return result;
    } });
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
