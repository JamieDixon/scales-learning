import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { getNotesForKey, generateIntervals } from './notes';
import { playNote } from './music';
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

const openNotes = {
  eadgbe: {
    notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    label: 'Guitar (Standard Tuning)'
  },
  dadgbe: {
    notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    label: 'Guitar (Drop D Tuning)'
  },
  dadgad: {
    notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'],
    label: 'Guitar (DADGAD Tuning)'
  },
  bass: {
    notes: ['E1', 'A1', 'D2', 'G2'],
    label: 'Bass Guitar (Standard Tuning)'
  }
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

const getNaturalOrSharp = notes => {
  const [natural] = notes.filter(x => !x.includes('#') && !x.includes('♭'));
  const [sharp] = notes.filter(x => x.includes('#'));
  return natural || sharp;
};

function App() {
  // all || diatonic || pentatonic
  const [notesToShow, setNotesToShow] = useState('all');
  const [modeName, setModeName] = useState('ionian');
  const [keyNote, setKeyNote] = useState('C');
  const [isLeftHanded, setIsLeftHanded] = useState(true);
  const [showOctaveNumbers, setShowOctaveNumbers] = useState(true);
  const [instrument, setInstrument] = useState({
    key: 'eadgbe',
    ...openNotes.eadgbe
  });

  const handedFunc = isLeftHanded ? reverse : id;

  const stringOpenNotes = reverse(instrument.notes);

  const fretCount = 27;

  const mode = modes[modeName];
  const modedIntervals = generateIntervals(intervals, mode);
  const notesInKey = getNotesForKey(keyNote, mode, modedIntervals, notes);
  const pentatonicNotes = pentatonic[modeName].map(n => notesInKey[n - 1]);

  const frets = handedFunc(
    Array(fretCount + 1)
      .fill('')
      .map((_, i) => i)
  );

  const strings = handedFunc(
    handedFunc(stringOpenNotes).map(st => {
      const startingOctave = parseInt(st[st.length - 1], 10);
      const note = st.slice(0, st.length - 1);
      const index = notes.indexOf(note);
      const right = notes.slice(0, index);
      const left = notes.slice(index, notes.length);

      let orderedNotes = [...left, ...right];

      while (orderedNotes.length < fretCount + 1) {
        orderedNotes = [
          ...orderedNotes,
          ...orderedNotes.slice(0, fretCount + 1 - orderedNotes.length)
        ];
      }

      let octave = startingOctave;
      orderedNotes = orderedNotes.map(n => {
        if (n === 'B#/C') {
          octave += 1;
        }

        const noteInKey = notesInKey.find(note => {
          const [a, b] = n.split('/');

          if (note === a) {
            return a;
          }

          if (note === b) {
            return b;
          }

          return null;
        });

        return `${noteInKey || n}${octave}`;
      });

      return handedFunc(orderedNotes);
    })
  );

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
                const octave = x[x.length - 1];
                const reactKey = `string-${i}-note-${x}-${octave}`;
                const noteOptions = x.slice(0, x.length - 1);

                const foundInKey = !!notesInKey.find(note =>
                  noteOptions.split('/').includes(note)
                );

                let hideNote = !foundInKey && notesToShow !== 'all';

                if (hideNote) {
                  return <td key={reactKey} />;
                }

                let nextNote = noteOptions;

                if (!foundInKey) {
                  nextNote = getNaturalOrSharp(noteOptions.split('/'));
                }

                const isPentNote = !!pentatonicNotes.find(note =>
                  noteOptions.split('/').includes(note)
                );

                hideNote = !isPentNote && notesToShow === 'pentatonic';

                if (hideNote) {
                  return <td key={reactKey} />;
                }

                const isRootNote = noteOptions.split('/').includes(keyNote);

                let className = foundInKey ? 'in-key note ' : 'note ';
                className += foundInKey && !isPentNote ? 'dia ' : '';
                className += isPentNote ? 'pent ' : '';
                className += isRootNote ? 'root ' : '';
                return (
                  <td
                    key={reactKey}
                    onClick={() => {
                      playNote(notes, nextNote + octave);
                    }}
                  >
                    <div className={className}>
                      {nextNote}
                      {showOctaveNumbers ? octave : ''}
                    </div>
                  </td>
                );
              })}
							<th>{i + 1}</th>
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
        <label htmlFor="handed">Show octave numbers?</label>
        <input
          type="checkbox"
          id="handed"
          checked={showOctaveNumbers}
          onChange={e => setShowOctaveNumbers(e.target.checked)}
        />
      </div>

      <div>
        <label htmlFor="instrument">Instrument:</label>
        <select
          id="instrument"
          value={instrument.key}
          onChange={e =>
            setInstrument({
              key: e.target.value,
              ...openNotes[e.target.value]
            })
          }
        >
          {Object.entries(openNotes).map(([key, value]) => (
            <option value={key}>{value.label}</option>
          ))}
        </select>
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
