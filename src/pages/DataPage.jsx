import { useRef, useState } from 'react'
import { Archive, Download, Trash2, Upload } from 'lucide-react'
import { useTaskFlow } from '../context/TaskFlowContext'
import { localDateKey } from '../utils/dates'
import {
  parseImport,
  replaceStoredState,
  serializeState,
} from '../utils/storage'
import SectionHeader from '../components/common/SectionHeader'

export default function DataPage() {
  const state = useTaskFlow()
  const fileRef = useRef()
  const [message, setMessage] = useState('')
  const download = () => {
    const blob = new Blob([serializeState(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `taskflow-backup-${localDateKey()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Backup downloaded.')
  }
  const upload = async (event) => {
    try {
      const next = parseImport(await event.target.files[0].text())
      if (confirm('Replace this workspace with the imported backup?')) {
        if (!replaceStoredState(next))
          throw new Error(
            'The imported workspace could not be saved. Your current data was not replaced. Free browser storage, then try again.',
          )
        state.importState(next)
        setMessage(
          'Backup restored successfully. Your previous workspace is preserved for recovery.',
        )
      }
    } catch (error) {
      setMessage(error.message)
    }
    event.target.value = ''
  }
  return (
    <div className="settings-card">
      <SectionHeader
        title="Keep your data portable"
        subtitle="TaskFlow data stays on this device unless you export it."
      />
      <div className="data-actions">
        <article>
          <span>
            <Download />
          </span>
          <div>
            <h3>Export a backup</h3>
            <p>Download tasks, categories, and preferences as JSON.</p>
          </div>
          <button className="secondary-button" onClick={download}>
            Export
          </button>
        </article>
        <article>
          <span>
            <Upload />
          </span>
          <div>
            <h3>Restore a backup</h3>
            <p>Import a previously exported TaskFlow JSON file.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => fileRef.current.click()}
          >
            Import
          </button>
          <input
            ref={fileRef}
            hidden
            type="file"
            aria-label="TaskFlow backup file"
            accept="application/json"
            onChange={upload}
          />
        </article>
        <article className="danger-zone">
          <span>
            <Trash2 />
          </span>
          <div>
            <h3>Clear this workspace</h3>
            <p>Permanently remove tasks and reset preferences.</p>
          </div>
          <button
            className="danger-button"
            onClick={() =>
              confirm('Clear all TaskFlow data? This cannot be undone.') &&
              state.reset()
            }
          >
            Clear data
          </button>
        </article>
      </div>
      {message && (
        <p className="status-message" role="status">
          {message}
        </p>
      )}
      <div className="privacy-note">
        <Archive />
        <div>
          <strong>Browser-only storage</strong>
          <p>
            Your data does not automatically sync between devices or browsers.
            Export regular backups if it matters to you.
          </p>
        </div>
      </div>
    </div>
  )
}
