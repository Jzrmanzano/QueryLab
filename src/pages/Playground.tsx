import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Workspace } from '../components/Workspace';
import { datasetIds } from '../content/datasets';

export function Playground() {
  // ?dataset=chinook opens a specific dataset (used by the schema guide). Otherwise start on the
  // small school dataset; bigger ones (e.g. chinook) load only when picked.
  const [params] = useSearchParams();
  const requested = params.get('dataset');
  const [dataset, setDataset] = useState(
    requested && datasetIds.includes(requested) ? requested : datasetIds.includes('school') ? 'school' : datasetIds[0],
  );
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
