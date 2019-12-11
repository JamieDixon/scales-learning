import React, { useReducer } from 'react';
import ReactDOM from 'react-dom';
import { getNotesForKey, calcDifferencesBetweenScales } from './notes';
import { playNote } from './music';
import Switch from 'react-switch';
import Select from 'react-select';
import { ordinalSuffix } from './suffix';
import './styles.css';

const T = 1;
const S = 0.5;

const modes = {
  ionian: [T, T, S, T, T, T, S],
  dorian: [T, S, T, T, T, S, T],
  phrygian: [S, T, T, T, S, T, T],
  lydian: [T, T, T, S, T, T, S],
  mixolydian: [T, T, S, T, T, S, T],
  aeolian: [T, S, T, T, S, T, T],
  locrian: [S, T, T, S, T, T, T],
  melodicminor: [T, S, T, T, T, T, S],
  harmonicminor: [T, S, T, T, S, T + S, S]
};

const pentatonic = {
  ionian: [1, 2, 3, 5, 6],
  dorian: [1, 3, 4, 5, 6],
  phrygian: [1, 2, 4, 6, 7],
  lydian: [1, 2, 3, 4, 6],
  mixolydian: [1, 2, 3, 5, 7],
  aeolian: [1, 3, 4, 5, 7],
  locrian: [1, 3, 4, 5, 7],
  melodicminor: [1, 3, 4, 5, 7],
  harmonicminor: [1, 3, 4, 5, 7]
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
  '0.5': 'Semitone',
  '1.5': 'Tone + Semitone'
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

const Footer = () => (
  <div>
    Developed by{' '}
    <a
      target="_blank"
      rel="noopener noreferrer"
      href="https://twitter.com/jamiedixon"
    >
      @jamiedixon
    </a>
  </div>
);

const reducer = (state, action) => {
  switch (action.type) {
    case 'setNotesToShow':
      return { ...state, notesToShow: action.payload };
    case 'setModeName':
      return { ...state, modeName: action.payload };
    case 'setKeyNote':
      return { ...state, keyNote: action.payload };
    case 'setIsLeftHanded':
      return { ...state, isLeftHanded: action.payload };
    case 'setShowOctaveNumbers':
      return { ...state, showOctaveNumbers: action.payload };
    case 'setHighlightMode':
      return { ...state, highlightMode: action.payload };
    case 'setInstrument':
      return { ...state, instrument: action.payload };
    case 'setHighlightNotes':
      return { ...state, highlightNotes: action.payload };
    case 'setHighlightFrets':
      return { ...state, highlightFrets: action.payload };
    case 'setFretCount':
      return { ...state, fretCount: action.payload };
    case 'setShowIntervals':
      return { ...state, showIntervals: action.payload };
    default:
      return state;
  }
};

const intervalShortNames = {
  0: 'R',
  1: 'm2',
  2: 'M2',
  3: 'm3',
  4: 'M3',
  5: 'P4',
  6: 'TT',
  7: 'P5',
  8: 'm6',
  9: 'M6',
  10: 'm7',
  11: 'M7'
};

const calcInterval = (nextNote, orderedChromatic) => {
  const noteIndex = orderedChromatic.findIndex(x => {
    const [left, right] = x.split('/');
    return left === nextNote || right === nextNote;
  });

  return intervalShortNames[noteIndex];
};

function App() {
  const [state, dispatch] = useReducer(reducer, {
    notesToShow: {
      value: 'pentatonic',
      label: 'Pentatonic'
    },
    modeName: {
      value: 'ionian',
      label: 'Ionian (Major)'
    },
    fretCount: {
      value: 27,
      label: 27
    },
    showIntervals: false,
    keyNote: 'C',
    isLeftHanded: false,
    showOctaveNumbers: true,
    highlightMode: false,
    highlightNotes: [],
    highlightFrets: [],
    instrument: {
      key: 'eadgbe',
      ...openNotes.eadgbe
    }
  });
  const {
    notesToShow,
    modeName,
    keyNote,
    isLeftHanded,
    showOctaveNumbers,
    highlightMode,
    instrument,
    highlightNotes,
    highlightFrets,
    fretCount,
    showIntervals
  } = state;

  const handedFunc = isLeftHanded ? reverse : id;
  const stringOpenNotes = instrument.notes;
  const mode = Object.keys(modes).indexOf(modeName.value);
  // const modedIntervals = generateIntervals(intervals, mode);
  const modedIntervals = modes[modeName.value];

  const notesInKey = getNotesForKey(keyNote, mode, modedIntervals, notes);
  const pentatonicNotes = pentatonic[modeName.value].map(
    n => notesInKey[n - 1]
  );

  const frets = handedFunc(
    Array(fretCount.value + 1)
      .fill('')
      .map((_, i) => i)
  );

  const startIndex = notes.findIndex(n => {
    const s = n.split('/');
    return s.includes(keyNote);
  });

  const orderedChromatic = [
    ...notes.slice(startIndex, notes.length),
    ...notes.slice(0, startIndex)
  ];

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

  const modeDegree = Math.abs(Object.keys(modes).indexOf(modeName.value));

  const sliceParams =
    modeDegree > 1 ? [-modeDegree, -modeDegree + 1] : [-modeDegree];

  const [enharmonicMajor] = notesInKey.slice(...sliceParams);

  // The notes in the major scale for this key
  const keysMajorScale = getNotesForKey(keyNote, null, intervals, notes);

  const differencesBetweenScales = calcDifferencesBetweenScales(
    keysMajorScale,
    notesInKey
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

                const highlightFretNumber = isLeftHanded
                  ? fretCount.value - j
                  : j;

                const tdClass = highlightFrets.includes(highlightFretNumber)
                  ? 'hi-fret '
                  : '';

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
                    <td className={tdClass + 'hidden-note'} key={reactKey}>
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
                    className={tdClass}
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

                          dispatch({
                            type: 'setHighlightNotes',
                            payload: nextHi
                          });
                        } else {
                          dispatch({
                            type: 'setHighlightNotes',
                            payload: [
                              ...highlightNotes,
                              i.toString() + j.toString()
                            ]
                          });
                        }
                      }
                    }}
                  >
                    <div className={className}>
                      {!showIntervals && nextNote}
                      {!showIntervals && showOctaveNumbers ? octave : ''}
                      {showIntervals &&
                        calcInterval(nextNote, orderedChromatic)}
                    </div>
                  </td>
                );
              })}
              <th className="string-number">{i + 1}</th>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            {frets.map(f => (
              <th
                className="fret-number"
                key={`bottom-nums-${f}`}
                onClick={() => {
                  if (highlightFrets.includes(f)) {
                    const index = highlightFrets.indexOf(f);

                    const next = [
                      ...highlightFrets.slice(0, index),
                      ...highlightFrets.slice(index + 1, highlightFrets.length)
                    ];

                    dispatch({ type: 'setHighlightFrets', payload: next });
                  } else {
                    dispatch({
                      type: 'setHighlightFrets',
                      payload: [...highlightFrets, f]
                    });
                  }
                }}
              >
                {f}
              </th>
            ))}
          </tr>
        </tfoot>
      </table>
      <div className="controls">
        <div className="options">
          <div>
            <label htmlFor="instrument">Instrument:</label>
            <Select
              value={{ value: instrument.key, label: instrument.label }}
              options={Object.entries(openNotes).reduce(
                (agg, [value, item]) => [...agg, { value, label: item.label }],
                []
              )}
              onChange={({ value }) =>
                dispatch({
                  type: 'setInstrument',
                  payload: { key: value, ...openNotes[value] }
                })
              }
            />
          </div>

          <div>
            <label htmlFor="which-key">Which key would you like to use?</label>
            <Select
              value={{ value: keyNote, label: keyNote }}
              options={[
                'A♭',
                'A',
                'B♭',
                'B',
                'C',
                'C#',
                'D',
                'E♭',
                'E',
                'F',
                'F#',
                'G'
              ].map(x => ({ value: x, label: x }))}
              onChange={e => dispatch({ type: 'setKeyNote', payload: e.value })}
            />
          </div>
          <div>
            <label htmlFor="which-mode">
              Which scale would you like to use?
            </label>{' '}
            <Select
              id="which-mode"
              value={modeName}
              options={[
                { value: 'ionian', label: 'Ionian (Major)' },
                { value: 'dorian', label: 'Dorian' },
                { value: 'phrygian', label: 'Phrygian' },
                { value: 'lydian', label: 'Lydian' },
                { value: 'mixolydian', label: 'Mixolydian' },
                { value: 'aeolian', label: 'Aeolian (Natural Minor)' },
                { value: 'locrian', label: 'Locrian' },
                { value: 'melodicminor', label: 'Melodic Minor' },
                { value: 'harmonicminor', label: 'Harmonic Minor' }
              ]}
              onChange={payload => dispatch({ type: 'setModeName', payload })}
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
              onChange={payload =>
                dispatch({ type: 'setNotesToShow', payload })
              }
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
              onChange={payload => dispatch({ type: 'setFretCount', payload })}
            />
          </div>

          <div />
          <div className="inline">
            <label htmlFor="handed">Left handed:</label>
            <Switcher
              checked={isLeftHanded}
              onChange={payload =>
                dispatch({ type: 'setIsLeftHanded', payload })
              }
            />
          </div>

          <div className="inline">
            <label htmlFor="handed">Show Note Intervals:</label>
            <Switcher
              checked={showIntervals}
              onChange={payload =>
                dispatch({ type: 'setShowIntervals', payload })
              }
            />
          </div>

          <div className="inline">
            <label htmlFor="handed">Octave numbers:</label>
            <Switcher
              checked={showOctaveNumbers}
              onChange={payload =>
                dispatch({ type: 'setShowOctaveNumbers', payload })
              }
            />
          </div>

          <div className="inline">
            <label htmlFor="chord-builder">Note Focus Mode:</label>
            <Switcher
              checked={highlightMode}
              onChange={payload =>
                dispatch({ type: 'setHighlightMode', payload })
              }
            />
          </div>
        </div>

        <div className="info">
          <p>Intervals of {modeName.label}</p>
          <ul className="interval-names">
            {modedIntervals
              .map(x => intervalNames[x])
              .map((int, i) => (
                <li key={`${int}-${i}`}>{int}</li>
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
          {mode > 0 && mode < 7 && (
            <>
              <p>
                <strong>
                  {keyNote} {modeName.label}
                </strong>{' '}
                is the {ordinalSuffix(mode + 1)} degree of the{' '}
                <strong>{enharmonicMajor} Major</strong> scale and contains the
                same notes.
              </p>
              <p>
                This means you can play the{' '}
                <strong>{enharmonicMajor} Major</strong> scale over the top of a
                chord progression in{' '}
                <strong>
                  {keyNote} {modeName.label}
                </strong>{' '}
                utilising <strong>{keyNote} as the tonic</strong>.
              </p>
              <p>
                Additionally,{' '}
                <strong>
                  {keyNote} {modeName.label}
                </strong>{' '}
                differs from its Major counterpart (
                <strong>{keyNote} Ionian (Major)</strong>) because of its{' '}
                <strong>{differencesBetweenScales.join(', ')}</strong>.
              </p>
              <p>
                This tells us that in order to get the{' '}
                <strong>{modeName.label} sound</strong>, we need to pay
                particular attention to the{' '}
                <strong>{differencesBetweenScales.join(', ')}</strong> along
                with our focus on <strong>{keyNote} as the tonic</strong>.
              </p>
            </>
          )}
        </div>
      </div>
      <div className="what-do">
        <h3>What can I do with Fretaculous?</h3>
        <ul>
          <li>
            <strong>Choose an instrument:</strong> Guitar (Standard), Drop D,
            DADGAD, Bass Guitar, etc
          </li>
          <li>
            <strong>Pick a key</strong> - This will highlight your root note in
            red, pentatonic notes in blue, and diatonic notes with a blue
            border.
          </li>
          <li>
            <strong>Choose a mode</strong> - Want to practice your C# Dorian? No
            problem!
          </li>
          <li>
            <strong>Which notes would you like to see?</strong> - Choose between
            All notes, diatonic, and pentatonic for a simplified view
          </li>
          <li>
            <strong>Switch</strong> between 27, 15, and 12 frets for ease of
            viewing
          </li>
          <li>
            <strong>Left handed</strong> - Switch between left and right handed
          </li>
          <li>
            <strong>Octave numbers</strong> - turn them on and off as you please
          </li>
          <li>
            <strong>Note Focus Mode</strong> - In this mode, all notes are
            grayed out until you click on them to highlight. Good for learning
            to build chords
          </li>
          <li>
            <strong>Fret Focus</strong> - Clicking the bottom fret numbers will
            highlight that fret. Good for isolating scale patterns
          </li>
          <li>
            <strong>Hear the notes</strong> - Clicking notes on the fretboard
            will play that note at the designated octave
          </li>
        </ul>
      </div>
      <Footer />
    </div>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
