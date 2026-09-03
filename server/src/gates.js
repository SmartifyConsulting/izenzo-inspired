export const GATE_NAMES = [
  'entity_verification',
  'ubo_disclosure',
  'sanctions_screening',
  'jurisdiction_resolution',
  'authority_binding',
  'terms_lock',
  'evidence_attachment',
  'bilateral_collapse_sign',
  'wad_certificate_issuance',
]

export function initGates() {
  return GATE_NAMES.map((name, i) => ({
    gate: `GATE_0${i + 1}`,
    name,
    status: 'pending',
    completed_at: null,
  }))
}

export function completeGate(gatesJson, gateIndex, note) {
  const gates = JSON.parse(gatesJson)
  if (!gates[gateIndex]) throw new Error('Invalid gate index')
  gates[gateIndex].status = 'verified'
  gates[gateIndex].completed_at = new Date().toISOString()
  if (note) gates[gateIndex].note = note
  return JSON.stringify(gates)
}

export function allGatesVerified(gatesJson) {
  const gates = JSON.parse(gatesJson)
  return gates.every((g) => g.status === 'verified')
}

export function gateProgress(gatesJson) {
  const gates = JSON.parse(gatesJson)
  const done = gates.filter((g) => g.status === 'verified').length
  return `${done}/${gates.length}`
}
