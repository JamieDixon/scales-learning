import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { getNotesForKey, generateIntervals } from './notes';
import { playNote } from './music';
import Switch from 'react-switch';
import Select from 'react-select';
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

const Switcher = ({ onChange, checked }) => (
  <Switch
    checked={checked}
    onChange={onChange}
    onColor="#86d3ff"
    onHandleColor="#2693e6"
    handleDiameter={30}
    uncheckedIcon={false}
    checkedIcon={false}
    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
    activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
    height={20}
    width={48}
  />
);

function App() {
  // all || diatonic || pentatonic
  const [notesToShow, setNotesToShow] = useState({
    value: 'pentatonic',
    label: 'Pentatonic'
  });
  const [modeName, setModeName] = useState({
    value: 'ionian',
    label: 'Ionian (Major)'
  });
  const [keyNote, setKeyNote] = useState('C');
  const [isLeftHanded, setIsLeftHanded] = useState(true);
  const [showOctaveNumbers, setShowOctaveNumbers] = useState(true);
  const [instrument, setInstrument] = useState({
    key: 'eadgbe',
    ...openNotes.eadgbe
  });
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightNotes, setHighlightNotes] = useState([]);
  const handedFunc = isLeftHanded ? reverse : id;

  const stringOpenNotes = instrument.notes;

  const [fretCount, setFretCount] = useState({ value: 27, label: 27 });

  const mode = modes[modeName.value];
  const modedIntervals = generateIntervals(intervals, mode);
  const notesInKey = getNotesForKey(keyNote, mode, modedIntervals, notes);
  const pentatonicNotes = pentatonic[modeName.value].map(
    n => notesInKey[n - 1]
  );

  const frets = handedFunc(
    Array(fretCount.value + 1)
      .fill('')
      .map((_, i) => i)
  );

  const strings = reverse(
    stringOpenNotes.map(st => {
      const startingOctave = parseInt(st[st.length - 1], 10);
      const note = st.slice(0, st.length - 1);
      const index = notes.indexOf(note);
      const right = notes.slice(0, index);
      const left = notes.slice(index, notes.length);

      let orderedNotes = [...left, ...right];

      while (orderedNotes.length < fretCount.value + 1) {
        orderedNotes = [
          ...orderedNotes,
          ...orderedNotes.slice(0, fretCount.value + 1 - orderedNotes.length)
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
              {n.map((x, j) => {
                const octave = x[x.length - 1];
                const reactKey = `string-${i}-note-${x}-${octave}`;
                const noteOptions = x.slice(0, x.length - 1);

                const foundInKey = !!notesInKey.find(note =>
                  noteOptions.split('/').includes(note)
                );

                let hideNote = !foundInKey && notesToShow.value !== 'all';

                let nextNote = noteOptions;

                if (!foundInKey) {
                  nextNote = getNaturalOrSharp(noteOptions.split('/'));
                }

                const isPentNote = !!pentatonicNotes.find(note =>
                  noteOptions.split('/').includes(note)
                );

                hideNote =
                  hideNote ||
                  (!isPentNote && notesToShow.value === 'pentatonic');

                if (hideNote) {
                  return (
                    <td className="hidden-note" key={reactKey}>
                      <div className="note">
                        {nextNote}
                        {showOctaveNumbers ? octave : ''}
                      </div>
                    </td>
                  );
                }

                const isRootNote = noteOptions.split('/').includes(keyNote);

                const isHighlighted = highlightNotes.includes(
                  i.toString() + j.toString()
                );

                let className = foundInKey ? 'in-key note ' : 'note ';
                className += foundInKey && !isPentNote ? 'dia ' : '';
                className += isPentNote ? 'pent ' : '';
                className += isRootNote ? 'root ' : '';
                className += isHighlighted ? 'highlight ' : '';
								className += highlightMode ? 'hi-mode ' : '';
                return (
                  <td
                    key={reactKey}
                    onClick={() => {
                      playNote(notes, nextNote + octave);

                      if (highlightMode) {
                        if (isHighlighted) {
                          const hiIndex = highlightNotes.indexOf(
                            i.toString() + j.toString()
                          );
                          const nextHi = [
                            ...highlightNotes.slice(0, hiIndex),
                            ...highlightNotes.slice(
                              hiIndex + 1,
                              highlightNotes.length
                            )
                          ];

                          setHighlightNotes(nextHi);
                        } else {
                          setHighlightNotes([
                            ...highlightNotes,
                            i.toString() + j.toString()
                          ]);
                        }
                      }
                    }}
                  >
                    <div className={className}>
                      {nextNote}
                      {showOctaveNumbers ? octave : ''}
                    </div>
                  </td>
                );
              })}
              <th class="string-number">{i + 1}</th>
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

      <div class="options">
        <div>
          <label htmlFor="instrument">Instrument:</label>
          <Select
            value={{ value: instrument.key, label: instrument.label }}
            options={Object.entries(openNotes).reduce(
              (agg, [value, item]) => [...agg, { value, label: item.label }],
              []
            )}
            onChange={({ value }) =>
              setInstrument({ key: value, ...openNotes[value] })
            }
          />
        </div>

        <div>
          <label htmlFor="which-key">Which key would you like to use?</label>
          <Select
            value={{ value: keyNote, label: keyNote }}
            options={[
              'A',
              'A#',
              'B',
              'C',
              'C#',
              'D',
              'D#',
              'E',
              'F',
              'F#',
              'G',
              'G#'
            ].map(x => ({ value: x, label: x }))}
            onChange={e => setKeyNote(e.value)}
          />
        </div>
        <div>
          <label htmlFor="which-mode">Which mode would you like to use?</label>{' '}
          <Select
            id="which-mode"
            value={modeName}
            options={[
              { value: 'ionian', label: 'Ionian (Major)' },
              { value: 'dorian', label: 'Dorian' },
              { value: 'phrygian', label: 'Phrygian' },
              { value: 'lydian', label: 'Lydian' },
              { value: 'mixolydian', label: 'Mixolydian' },
              { value: 'aeolian', label: 'Aeolian (Natural Minor)' }
            ]}
            onChange={setModeName}
          />
        </div>

        <div>
          <label htmlFor="which-notes">Which notes do you want to see?</label>
          <Select
            value={notesToShow}
            options={[
              { value: 'all', label: 'All' },
              { value: 'diatonic', label: 'Diatonic' },
              { value: 'pentatonic', label: 'Pentatonic' }
            ]}
            onChange={setNotesToShow}
          />
        </div>

        <div>
          <label htmlFor="fretcount">Fret count</label>
          <Select
            value={fretCount}
            options={[
              { value: 12, label: 12 },
              { value: 15, label: 15 },
              { value: 27, label: 27 }
            ]}
            onChange={setFretCount}
          />
        </div>

				<div />
        <div class="inline">
          <label htmlFor="handed">Left handed:</label>
          <Switcher checked={isLeftHanded} onChange={setIsLeftHanded} />
        </div>

        <div class="inline">
          <label htmlFor="handed">Octave numbers:</label>
          <Switcher
            checked={showOctaveNumbers}
            onChange={setShowOctaveNumbers}
          />
        </div>
        
				<div class="inline">
          <label htmlFor="chord-builder">Chord Builder Mode:</label>
          <Switcher
            checked={highlightMode}
            onChange={setHighlightMode}
          />
        </div>
      </div>

      <div class="info">
        <p>Intervals of {modeName.label}</p>
        <ul className="interval-names">
          {modedIntervals
            .map(x => intervalNames[x])
            .map(int => (
              <li>{int}</li>
            ))}
        </ul>
        <p>
          Diatonic notes in {keyNote} {modeName.label}
        </p>
        <ul className="scale-notes">
          {notesInKey.map(n => (
            <li className="list-note" key={`dia-notes-${n}`}>
              {n}
            </li>
          ))}
        </ul>

        <p>
          Pentatonic notes in {keyNote} {modeName.label}
        </p>
        <ul className="scale-notes">
          {pentatonicNotes.map(n => (
            <li className="list-note" key={`pent-notes-${n}`}>
              {n}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
