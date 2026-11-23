import { useState } from 'react';
import { Workspace } from '../components/Workspace';
import { datasetIds } from '../content/datasets';

export function Playground() {
  const [dataset, setDataset] = useState(datasetIds[0] ?? 'school');
  const [sql, setSql] = useState('SELECT name FROM sqlite_master WHERE type = \'table\';');

  return (
    <div className="page wide">
      <div className="playground-head">
        <h1>Playground</h1>
        <label>
          Dataset{' '}
          <select value={dataset} onChange={(e) => setDataset(e.target.value)}>
            {datasetIds.map((id) => (
              <option key={id}>{id}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="lead">
        Write any query you like. Nothing is graded, and nothing you run can break the data: every run starts from a fresh copy.
      </p>
      <Workspace datasetId={dataset} value={sql} onChange={setSql} />
    </div>
  );
}
