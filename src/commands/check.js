import { apiCheck } from '../api/check.js'
import { ICONS, renderTable, sanitizeForLog } from '../utils/tui.js'

export async function checkCommand() {
  const result = await apiCheck(process.cwd())

  const { skills, updatesAvailable, unsafeAvailable = 0 } = result
  if (skills.length === 0) {
    console.log('\nNo installed skills found.')
    return
  }

  // Count statuses for summary
  const skippedCount = skills.filter((s) => s.status === 'skipped').length
  const erroredCount = skills.filter((s) => s.status === 'error').length

  console.log(`\nChecking ${skills.length} skill(s) for updates:\n`)

  const rows = []
  for (const s of skills) {
    if (s.status === 'skipped') {
      rows.push([sanitizeForLog(s.slug), `${ICONS.skip} skipped`, sanitizeForLog(s.reason)])
    } else if (s.status === 'unsafe_update') {
      rows.push([
        sanitizeForLog(s.slug),
        `${ICONS.error} UNSAFE UPDATE`,
        `security scan: ${sanitizeForLog(s.reason)}`,
      ])
    } else if (s.status === 'update_available') {
      const detail = 'update available'
      rows.push([sanitizeForLog(s.slug), `${ICONS.update} update`, detail])
    } else if (s.status === 'up_to_date') {
      rows.push([sanitizeForLog(s.slug), `${ICONS.ok} up to date`, '-'])
    } else if (s.status === 'error') {
      rows.push([sanitizeForLog(s.slug), `${ICONS.error} error`, sanitizeForLog(s.reason)])
    }
  }
  for (const line of renderTable(['SKILL', 'STATUS', 'DETAIL'], rows)) {
    console.log(line)
  }

  // Never let a flagged update hide behind the ordinary update count.
  if (unsafeAvailable > 0) {
    console.error(
      `\n⚠️  ${unsafeAvailable} skill(s) have an update whose upstream content trips the security scan:`,
    )
    for (const s of skills) {
      if (s.status !== 'unsafe_update') continue
      console.error(`\n   ${sanitizeForLog(s.slug)} (${sanitizeForLog(s.source)})`)
      console.error(`   ${sanitizeForLog(s.reason)}`)
    }
    console.error(
      '\n   Do not update these. Review the source, or pin the version you trust.',
    )
  }

  console.log(
    updatesAvailable > 0
      ? `\n${updatesAvailable} update(s) available — run \`rolecraft update <slug>\`\n`
      : '\nAll skills are up to date.\n',
  )
  console.log(
    `Checked ${skills.length} skill(s): ${updatesAvailable} update(s) available, ${skippedCount} skipped (no source), ${erroredCount} could not be checked.`,
  )
}
