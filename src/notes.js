import { ordinalSuffix } from './suffix';

export const generateIntervals = (majorIntervals, mode) => {
  const rightIntervals = majorIntervals.slice(0, mode);
  const leftIntervals = majorIntervals.slice(mode, majorIntervals.length);
  return [...leftIntervals, ...rightIntervals];
};

export const getNotesForKey = (key, mode, intervals, notes) => {
  const keyIndex = notes.findIndex(note => {
    const [a, b] = note.split('/');
    return a === key || b === key;
  });

  const rightNotes = notes.slice(0, keyIndex);
  const leftNotes = notes.slice(keyIndex, notes.length);
  const orderedNotes = [...leftNotes, ...rightNotes];

  const keyNotes = intervals.reduce(
    (agg, interval) => {
      const { notes, count } = agg;
      const nextCount = count + (interval + interval);
      const note = orderedNotes[nextCount];

      if (!note) {
        return notes;
      }

      const [sharp, flat] = note.split('/');
      const [noteLetter] = note;

      const noteAlreadyUsed = agg.notes.find(note => {
        return note[0] === noteLetter;
      });

      const realNote = noteAlreadyUsed ? flat : sharp;

      return {
        count: nextCount,
        notes: [...agg.notes, realNote]
      };
    },
    { count: 0, notes: [key] }
  );

  return keyNotes;
};

// keysMajorScale - The given keys major scale
// notesInKey - the nodes in the current modal scale
export const calcDifferencesBetweenScales = (keysMajorScale, notesInKey) => {
  return keysMajorScale.reduce((agg, next, i) => {
    const scaleModeNote = notesInKey[i];

    if (next === scaleModeNote) {
      return agg;
    }

    let label = '';

    if (scaleModeNote.includes('#') || next.includes('♭')) {
      label = 'raised';
    }

    if (scaleModeNote.includes('♭') || next.includes('#')) {
      label = 'lowered';
    }

    if (i === keysMajorScale.length - 1 && i > 0) {
      label = 'and ' + label;
    }

    return [...agg, `${label} ${ordinalSuffix(i + 1)} (${scaleModeNote})`];
  }, []);
};
