export const getNotesForKey = (key, mode, majorIntervals, notes) => {
const rightIntervals = majorIntervals.slice(0, mode);
const leftIntervals = majorIntervals.slice(mode, majorIntervals.length);
const intervals = [...leftIntervals, ...rightIntervals];
const keyIndex = notes.findIndex(note => {
  const [a, b] = note.split('/');
  return a === key || b === key;
});

const rightNotes = notes.slice(0,keyIndex);
const leftNotes = notes.slice(keyIndex, notes.length);
const orderedNotes = [...leftNotes, ...rightNotes];

const keyNotes = intervals.reduce((agg, interval) => {
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
  }
}, { count: 0, notes: [key]});

return keyNotes;
};