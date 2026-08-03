import React from 'react';

export const SchemaOverview: React.FC = () => {
  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <h2 className="card-title">🗄️ Initial PocketBase Schema Definition</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        The <span className="code-badge">bookmarks</span> collection schema scaffolded in <span className="code-badge">pb_migrations/</span> & <span className="code-badge">pb_schema.json</span>:
      </p>

      <table className="schema-table">
        <thead>
          <tr>
            <th>Field Name</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description / Constraints</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span className="code-badge">link</span></td>
            <td>URL</td>
            <td>Yes</td>
            <td>Target bookmark URL link</td>
          </tr>
          <tr>
            <td><span className="code-badge">title</span></td>
            <td>Text</td>
            <td>Yes</td>
            <td>Display title for the bookmark</td>
          </tr>
          <tr>
            <td><span className="code-badge">favicon</span></td>
            <td>Text</td>
            <td>No</td>
            <td>Path, URL, or emoji string for the favicon</td>
          </tr>
          <tr>
            <td><span className="code-badge">order</span></td>
            <td>Number</td>
            <td>No</td>
            <td>Numerical sorting order position</td>
          </tr>
          <tr>
            <td><span className="code-badge">user</span></td>
            <td>Relation</td>
            <td>Yes</td>
            <td>Relation to PocketBase <span className="code-badge">users</span> record</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
