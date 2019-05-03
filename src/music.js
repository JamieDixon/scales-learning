let context = null;
let vco = null;
let vca = null;

const createAudio = () => {
  if (!context) {
    context = new AudioContext();

    // voltage controlled oscillator
    vco = context.createOscillator();
    vco.type = vco.SINE;
    vco.frequency.value = 200;
    vco.start(0);

    // voltage controlled amplifier
    vca = context.createGain();
    vca.gain.setValueAtTime(0, context.currentTime);

    vco.connect(vca);
    vca.connect(context.destination);
  }

  return [vco, vca];
};

var getFrequencyOfNote = function(notes, note) {
  const octave = note.length === 3 ? note.charAt(2) : note.charAt(1);
  let key_number = notes.findIndex(x =>
    x.split('/').includes(note.slice(0, -1))
  );

  if (key_number < 3) {
    key_number = key_number + 12 + (octave - 1) * 12 + 1;
  } else {
    key_number = key_number + (octave - 1) * 12 + 1;
  }

  return 440 * Math.pow(2, (key_number - 49) / 12);
};

export const playNote = (notes, note) => {
  const frequency = getFrequencyOfNote(notes, note);
  const [vco, vca] = createAudio();
  vco.frequency.value = frequency;
  vca.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.1);

  setTimeout(() => {
    vca.gain.linearRampToValueAtTime(0.0, context.currentTime + 0.1);
  }, 300);
};
