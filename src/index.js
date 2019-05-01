import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { getNotesForKey, generateIntervals } from './notes';
import './styles.css';

// Interval offsets fron ionian major mode
const modes = {
  ionian: 0,
  dorian: 1,
  phrygian: 2,
  lydian: 3,
  mixolydian: 4,
  aeolian: 5
};

const pentatonic = {
  ionian: [1, 2, 3, 5, 6],
  dorian: [1, 3, 4, 5, 6],
  phrygian: [1, 2, 4, 6, 7],
  lydian: [1, 2, 3, 4, 6],
  mixolydian: [1, 2, 3, 5, 7],
  aeolian: [1, 3, 4, 5, 7]
};

const intervalNames = {
  '1': 'Tone',
  '0.5': 'Semitone'
};

const intervals = [1, 1, 0.5, 1, 1, 1, 0.5];
const notes = [
  'A',
  'A#/B♭',
  'B',
  'B#/C',
  'C#/D♭',
  'D',
  'D#/E♭',
  'E',
  'E#/F',
  'F#/G♭',
  'G',
  'G#/A♭'
];

const reverse = x => x.reverse();
const id = x => x;

function App() {
  // all || diatonic || pentatonic
  const [notesToShow, setNotesToShow] = useState('all');
  const [modeName, setModeName] = useState('ionian');
  const [keyNote, setKeyNote] = useState('C');
  const [isLeftHanded, setIsLeftHanded] = useState(true);
  const [chordPosition, setChordPosition] = useState(1);

  const handedFunc = isLeftHanded ? reverse : id;

  const stringOpenNotes = reverse(['E', 'A', 'D', 'G', 'B', 'E']);
  const fretCount = 20;

  const mode = modes[modeName];
  const modedIntervals = generateIntervals(intervals, mode);
  const notesInKey = getNotesForKey(keyNote, mode, modedIntervals, notes);
  const pentatonicNotes = pentatonic[modeName].map(n => notesInKey[n - 1]);

  const frets = handedFunc(
    Array(fretCount + 1)
      .fill('')
      .map((_, i) => i)
  ); // .reverse();

  const strings = stringOpenNotes.map(st => {
    const index = notes.indexOf(st);
    const right = notes.slice(0, index);
    const left = notes.slice(index, notes.length);

    let orderedNotes = [...left, ...right];

    orderedNotes =
      orderedNotes.length < fretCount + 1
        ? [
            ...orderedNotes,
            ...orderedNotes.slice(0, fretCount + 1 - orderedNotes.length)
          ]
        : orderedNotes;

    return handedFunc(orderedNotes);
  });

  return (
    <div className="App">
      <table>
        <thead>
          <tr>
            {frets.map(f => (
              <th key={`top-nums-${f}`}>{f}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {strings.map((n, i) => (
            <tr key={`string-${i}`}>
              {n.map((x, i) => {
                const reactKey = `string-${i}-note-${x}-${i}`;
                const foundInKey = notesInKey.find(note => {
                  return x.split('/').includes(note);
                });

                let hideNote = !foundInKey && notesToShow !== 'all';

                if (hideNote) {
                  return <td key={reactKey} />;
                }

                const nextNote = foundInKey || x.split('/')[0];

                const isPentNote = pentatonicNotes.includes(nextNote);

                hideNote = !isPentNote && notesToShow === 'pentatonic';

                if (hideNote) {
                  return <td key={reactKey} />;
                }

                const isRootNote = nextNote === keyNote;

                let className = foundInKey ? 'in-key note ' : 'note ';
                className += foundInKey && !isPentNote ? 'dia ' : '';
                className += isPentNote ? 'pent ' : '';
                className += isRootNote ? 'root ' : '';
                return (
                  <td key={reactKey}>
                    <div className={className}>{nextNote}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            {frets.map(f => (
              <th key={`bottom-nums-${f}`}>{f}</th>
            ))}
          </tr>
        </tfoot>
      </table>

      <ul className="interval-names">
        {modedIntervals
          .map(x => intervalNames[x])
          .map(int => (
            <li>{int}</li>
          ))}
      </ul>

      <div>
        <label htmlFor="handed">Left handed?</label>
        <input
          type="checkbox"
          id="handed"
          checked={isLeftHanded}
          onChange={e => setIsLeftHanded(e.target.checked)}
        />
      </div>

      <div>
        <label htmlFor="which-key">Which key would you like to use?</label>
        <select
          id="which-key"
          value={keyNote}
          onChange={e => setKeyNote(e.target.value)}
        >
          <option>A</option>
          <option>A#</option>
          <option>B</option>
          <option>C</option>
          <option>C#</option>
          <option>D</option>
          <option>D#</option>
          <option>E</option>
          <option>F</option>
          <option>F#</option>
          <option>G</option>
          <option>G#</option>
        </select>
      </div>

      <div>
        <label htmlFor="which-mode">Which mode would you like to use?</label>
        <select
          id="which-mode"
          value={modeName}
          onChange={e => setModeName(e.target.value)}
        >
          <option value="ionian">Ionian (Major)</option>
          <option value="dorian">Dorian</option>
          <option value="phrygian">Phrygian</option>
          <option value="lydian">Lydian</option>
          <option value="mixolydian">Mixolydian</option>
          <option value="aeolian">Aeolian (Natural Minor)</option>
        </select>
      </div>

      <div>
        <label htmlFor="which-notes">Which notes do you want to see?</label>
        <select
          id="which-notes"
          value={notesToShow}
          onChange={e => setNotesToShow(e.target.value)}
        >
          <option value="all">All</option>
          <option value="diatonic">Diatonic</option>
          <option value="pentatonic">Pentatonic</option>
        </select>
      </div>

      <p>Notes in this key</p>
      <ul className="scale-notes">
        {notesInKey.map(n => (
          <li key={`dia-notes-${n}`}>{n}</li>
        ))}
      </ul>

      <p>Pentatonic notes in this key</p>
      <ul className="scale-notes">
        {pentatonicNotes.map(n => (
          <li key={`pent-notes-${n}`}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
