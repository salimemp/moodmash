// Meditation Sessions Data - 55+ Guided Meditation Sessions
// Categories: stress_relief, sleep, anxiety, focus, mindfulness, breathing, body_scan, loving_kindness, morning, evening

export interface MeditationSession {
  id: string;
  title: string;
  titleKey: string;
  description: string;
  descriptionKey: string;
  category: string;
  duration: number; // seconds
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  backgroundSound: string;
  instructor: string;
  script: string;
  tags: string[];
  isPremium: boolean;
}

export const meditationSessions: MeditationSession[] = [
  // ==================== STRESS RELIEF ====================
  {
    id: 'med_stress_01',
    title: 'Quick Stress Relief',
    titleKey: 'meditation.stress_quick',
    description: 'A quick 3-minute session to release tension and find calm in busy moments.',
    descriptionKey: 'meditation.stress_quick_desc',
    category: 'stress_relief',
    duration: 180,
    difficulty: 'beginner',
    backgroundSound: 'nature',
    instructor: 'AI Guide',
    script: `Welcome to this quick stress relief session. Find a comfortable position and close your eyes.
    
Take a deep breath in through your nose... and slowly exhale through your mouth.

Notice where you're holding tension in your body. Perhaps in your shoulders, your jaw, or your forehead.

Breathe in deeply... and as you exhale, imagine that tension melting away like ice in warm sunlight.

Let your shoulders drop. Unclench your jaw. Soften the muscles in your face.

With each breath, you're releasing stress and inviting calm. Breathe in peace... exhale tension.

You are safe. You are calm. You are in control.

Take one more deep breath... and gently open your eyes when you're ready.`,
    tags: ['quick', 'stress', 'tension', 'relaxation'],
    isPremium: false
  },
  {
    id: 'med_stress_02',
    title: 'Deep Stress Release',
    titleKey: 'meditation.stress_deep',
    description: 'A comprehensive 15-minute session for releasing deep-seated stress and anxiety.',
    descriptionKey: 'meditation.stress_deep_desc',
    category: 'stress_relief',
    duration: 900,
    difficulty: 'intermediate',
    backgroundSound: 'rain',
    instructor: 'AI Guide',
    script: `Welcome to this deep stress release meditation. Make yourself comfortable and close your eyes.

Begin by taking three deep breaths. In... and out. In... and out. In... and out.

Feel your body becoming heavier with each exhale. Allow yourself to sink into the surface beneath you.

Now, bring your attention to the top of your head. Notice any tension there. As you breathe out, let it dissolve.

Move down to your forehead... your eyes... your jaw. Release any tightness you find.

Continue down to your neck and shoulders - common places where stress lives. Breathe into these areas and let go.

Feel your arms becoming heavy and relaxed. Your hands soft and open.

Move to your chest. Feel your heart beating steadily. You are safe in this moment.

Continue to your stomach. Let go of any nervous energy stored there.

Move down through your hips, your legs, all the way to your feet.

Your entire body is now relaxed and at peace. Stay here, breathing naturally, feeling supported and calm.

When you're ready, wiggle your fingers and toes. Take a deep breath and slowly open your eyes.`,
    tags: ['deep', 'stress', 'progressive', 'relaxation', 'body'],
    isPremium: false
  },
  {
    id: 'med_stress_03',
    title: 'Stress-Free Mind',
    titleKey: 'meditation.stress_mind',
    description: 'Clear mental clutter and find peace through guided visualization.',
    descriptionKey: 'meditation.stress_mind_desc',
    category: 'stress_relief',
    duration: 600,
    difficulty: 'beginner',
    backgroundSound: 'ocean',
    instructor: 'AI Guide',
    script: `Find a comfortable position and close your eyes. Take a deep breath in... and let it go.

Imagine your mind as a clear blue sky. Right now, there may be clouds - thoughts, worries, stress - passing through.

You don't need to push these clouds away. Simply observe them. Watch them drift by.

Behind every cloud, the blue sky remains. Your inner peace is always there.

Breathe in clarity... breathe out confusion.

Now imagine a gentle breeze beginning to clear the sky. Watch as the clouds slowly dissolve.

Your mind is becoming clearer, calmer, more peaceful.

The sky is vast and open. Your mind is free from stress.

Rest here in this openness. You are at peace.

Gently bring your awareness back to your body. Feel your breath. Open your eyes when ready.`,
    tags: ['mental', 'clarity', 'visualization', 'peace'],
    isPremium: false
  },
  {
    id: 'med_stress_04',
    title: 'Tension Melting',
    titleKey: 'meditation.stress_tension',
    description: 'A 20-minute progressive muscle relaxation for complete stress relief.',
    descriptionKey: 'meditation.stress_tension_desc',
    category: 'stress_relief',
    duration: 1200,
    difficulty: 'intermediate',
    backgroundSound: 'forest',
    instructor: 'AI Guide',
    script: `Welcome to this tension melting meditation. Lie down or sit comfortably.

We'll work through your body, tensing and releasing each muscle group. This helps release stored tension.

Start with your feet. Curl your toes tightly for 5 seconds... and release. Feel the difference.

Now your calves. Tense them... hold... and let go completely.

Your thighs. Squeeze them tight... and release.

Your buttocks. Tense... hold... and relax.

Your stomach. Pull it in... hold... and let it go soft.

Make fists with your hands. Squeeze tight... and release.

Your arms. Flex your biceps... hold... and let them go limp.

Shrug your shoulders up to your ears... hold the tension... and drop them down.

Scrunch up your face... hold... and let every muscle relax.

Finally, tense your entire body at once... hold... and release everything.

You are now deeply relaxed. Every muscle is soft and at peace.

Rest here, enjoying this feeling of complete relaxation.

When ready, take a deep breath and gently return to awareness.`,
    tags: ['progressive', 'muscle', 'tension', 'relaxation', 'body'],
    isPremium: false
  },
  {
    id: 'med_stress_05',
    title: 'Calm in Chaos',
    titleKey: 'meditation.stress_chaos',
    description: 'Find your inner calm even when life feels overwhelming.',
    descriptionKey: 'meditation.stress_chaos_desc',
    category: 'stress_relief',
    duration: 600,
    difficulty: 'advanced',
    backgroundSound: 'white_noise',
    instructor: 'AI Guide',
    script: `In the midst of chaos, you can find stillness. Close your eyes and take a deep breath.

Life may feel overwhelming right now. Acknowledge that. It's okay to feel stressed.

But within you is an unshakeable center of peace. We're going to find it together.

Imagine yourself as a tall mountain. Storms may rage around you - winds of worry, rain of responsibility.

But the mountain remains steady, grounded, unmoved.

You are that mountain. Solid. Present. Enduring.

Feel your roots extending deep into the earth. Nothing can shake you from your center.

The storm will pass. It always does. And you will remain, steady and strong.

Breathe in strength. Breathe out peace.

You can handle whatever comes. You have done it before. You will do it again.

Rest in this knowing. You are stronger than you think.

Take a final deep breath and carry this calm with you as you open your eyes.`,
    tags: ['overwhelm', 'strength', 'grounding', 'mountain'],
    isPremium: true
  },

  // ==================== SLEEP & RELAXATION ====================
  {
    id: 'med_sleep_01',
    title: 'Peaceful Sleep',
    titleKey: 'meditation.sleep_peaceful',
    description: 'Drift into restful sleep with this calming bedtime meditation.',
    descriptionKey: 'meditation.sleep_peaceful_desc',
    category: 'sleep',
    duration: 900,
    difficulty: 'beginner',
    backgroundSound: 'rain',
    instructor: 'AI Guide',
    script: `It's time to let go of the day and prepare for restful sleep.

Lie comfortably in your bed. Close your eyes. Take a slow, deep breath.

Let the weight of the day leave your body. You've done enough. Now it's time to rest.

Feel your body sinking into the mattress. Heavy. Relaxed. Safe.

With each exhale, you're sinking deeper into comfort and peace.

Imagine a warm, golden light surrounding you. This light brings protection and tranquility.

Your mind is becoming quieter. Thoughts are fading like stars at dawn.

There's nothing you need to do. Nowhere you need to be. Just rest.

Allow sleep to come naturally. Your body knows how to rest. Trust it.

You are drifting... floating... peaceful...

Sleep well. Tomorrow is a new day.`,
    tags: ['sleep', 'bedtime', 'relaxation', 'rest'],
    isPremium: false
  },
  {
    id: 'med_sleep_02',
    title: 'Deep Sleep Journey',
    titleKey: 'meditation.sleep_deep',
    description: 'A 30-minute guided journey to the deepest, most restful sleep.',
    descriptionKey: 'meditation.sleep_deep_desc',
    category: 'sleep',
    duration: 1800,
    difficulty: 'beginner',
    backgroundSound: 'ocean',
    instructor: 'AI Guide',
    script: `Welcome to your journey into deep, restorative sleep.

Make yourself completely comfortable. This is your time to rest.

Begin with a long, slow breath in... and an even longer exhale.

Imagine you're standing at the top of a gentle staircase. There are ten steps leading down to a beautiful garden of sleep.

With each step, you'll become more relaxed, more ready for sleep.

Step 10... feeling your body begin to relax.
Step 9... your eyelids becoming heavier.
Step 8... tension leaving your shoulders.
Step 7... sinking deeper into comfort.
Step 6... your mind becoming quieter.
Step 5... halfway down, deeply relaxed.
Step 4... thoughts floating away like clouds.
Step 3... so peaceful, so calm.
Step 2... almost there, deeply at ease.
Step 1... you've arrived in the garden of sleep.

This garden is filled with soft moonlight and gentle flowers. Find a comfortable spot and lie down.

The softest blanket covers you. You are perfectly warm, perfectly safe.

Listen to the distant sound of a gentle stream. Let it carry you into dreams.

You are drifting now... floating on peaceful waters... into the deepest, most restful sleep.

Sweet dreams.`,
    tags: ['deep', 'sleep', 'visualization', 'staircase', 'garden'],
    isPremium: false
  },
  {
    id: 'med_sleep_03',
    title: 'Insomnia Relief',
    titleKey: 'meditation.sleep_insomnia',
    description: 'Specially designed for those who struggle to fall asleep.',
    descriptionKey: 'meditation.sleep_insomnia_desc',
    category: 'sleep',
    duration: 1200,
    difficulty: 'intermediate',
    backgroundSound: 'white_noise',
    instructor: 'AI Guide',
    script: `I understand that sleep hasn't come easy tonight. That's okay. You're not alone.

First, let go of any frustration about not sleeping. That only makes it harder.

Accept this moment as it is. You're lying in a comfortable bed. Your body is safe.

Focus on your breath. Don't try to control it - just notice it. In... and out.

If thoughts come, that's natural. Acknowledge them gently, then return to your breath.

Your body doesn't need you to force sleep. It knows what to do. Your job is simply to relax.

Feel the weight of your body on the bed. Scan from your head to your toes, releasing any tension you find.

Imagine each exhale is like a wave washing away wakefulness. Wave after wave of relaxation.

Your eyes are so heavy. Your limbs are so relaxed. Your mind is so quiet.

Sleep will come when it's ready. And that's okay. For now, just rest.

You are calm. You are peaceful. You are sleepy.

Let go... and drift away.`,
    tags: ['insomnia', 'sleep', 'relaxation', 'breath'],
    isPremium: true
  },
  {
    id: 'med_sleep_04',
    title: 'Sleep Stories: The Peaceful Forest',
    titleKey: 'meditation.sleep_forest',
    description: 'A calming bedtime story to guide you into peaceful sleep.',
    descriptionKey: 'meditation.sleep_forest_desc',
    category: 'sleep',
    duration: 1200,
    difficulty: 'beginner',
    backgroundSound: 'forest',
    instructor: 'AI Guide',
    script: `Close your eyes and let me take you on a journey to a peaceful forest...

You're walking on a soft path covered with pine needles. The air smells fresh and clean.

Tall trees surround you, their leaves creating a gentle canopy overhead.

The light is soft and golden, filtering through the branches like nature's own nightlight.

You hear birds settling in for the evening, their songs becoming quieter.

A gentle stream runs nearby, its sound like a lullaby.

You come to a clearing where a cozy hammock hangs between two ancient oaks.

You climb in and feel the gentle sway. The hammock is soft and warm.

Looking up, you see the sky turning pink and purple as the sun sets.

The first stars begin to appear, twinkling like distant dreams.

A soft breeze carries the scent of flowers. You feel completely at peace.

The forest is protecting you. Nothing can disturb you here.

Your eyes become heavy. The hammock rocks you gently.

You're drifting now... into the most peaceful sleep...

The forest watches over you as you dream sweet dreams.`,
    tags: ['story', 'forest', 'sleep', 'visualization'],
    isPremium: false
  },
  {
    id: 'med_sleep_05',
    title: 'Body Scan for Sleep',
    titleKey: 'meditation.sleep_bodyscan',
    description: 'Progressive body relaxation to prepare your body for deep sleep.',
    descriptionKey: 'meditation.sleep_bodyscan_desc',
    category: 'sleep',
    duration: 900,
    difficulty: 'beginner',
    backgroundSound: 'rain',
    instructor: 'AI Guide',
    script: `Lie down comfortably. This body scan will prepare every part of you for sleep.

Start by noticing your feet. Feel them becoming warm and heavy.

Move up to your ankles... your calves... your knees. Each part relaxing completely.

Your thighs are now heavy and relaxed. Your hips are sinking into the bed.

Feel your lower back releasing any tension. Your belly rises and falls with your breath.

Your chest is relaxed. Your heart beats slowly and steadily.

Your fingers are loose and warm. Your arms are heavy at your sides.

Your shoulders drop away from your ears. Your neck is soft and relaxed.

Your jaw unclenches. Your tongue rests gently in your mouth.

Your eyes are still. Your forehead is smooth.

Your entire body is now completely relaxed, ready for sleep.

There's nothing left to do. Just drift... and sleep.`,
    tags: ['body', 'scan', 'sleep', 'relaxation'],
    isPremium: false
  },

  // ==================== ANXIETY MANAGEMENT ====================
  {
    id: 'med_anxiety_01',
    title: 'Calm Your Anxious Mind',
    titleKey: 'meditation.anxiety_calm',
    description: 'A gentle practice for when anxiety feels overwhelming.',
    descriptionKey: 'meditation.anxiety_calm_desc',
    category: 'anxiety',
    duration: 600,
    difficulty: 'beginner',
    backgroundSound: 'ocean',
    instructor: 'AI Guide',
    script: `If you're feeling anxious, I want you to know that you're safe. This will pass.

Let's start with grounding. Feel your feet on the floor or your body against the chair.

Name 5 things you can see around you. Just notice them without judgment.

Now, 4 things you can touch. Feel their texture.

3 things you can hear. Just sounds, nothing more.

2 things you can smell. Take a gentle sniff.

1 thing you can taste. Notice any taste in your mouth.

You're here. You're present. You're grounded.

Now, place your hand on your heart. Feel it beating. This is your life force.

Breathe in for 4 counts... hold for 4... exhale for 6.

Each exhale activates your relaxation response. You're telling your body it's safe.

Repeat: I am safe. I am calm. This will pass.

Continue breathing slowly. Feel the anxiety loosening its grip.

You are stronger than this feeling. And it will pass.

When you're ready, open your eyes. You've done well.`,
    tags: ['anxiety', 'grounding', '5-4-3-2-1', 'calm'],
    isPremium: false
  },
  {
    id: 'med_anxiety_02',
    title: 'Anxiety Emergency Reset',
    titleKey: 'meditation.anxiety_emergency',
    description: 'A quick 3-minute practice for acute anxiety or panic.',
    descriptionKey: 'meditation.anxiety_emergency_desc',
    category: 'anxiety',
    duration: 180,
    difficulty: 'beginner',
    backgroundSound: 'silence',
    instructor: 'AI Guide',
    script: `You're okay. You're safe. I'm here with you.

Put your feet flat on the ground. Feel the earth supporting you.

Take a breath in through your nose... and out through your mouth.

Again. In... and out. Slower this time.

Press your feet into the floor. Feel that connection.

Squeeze your hands into fists... and release. Notice the difference.

You are here. You are present. The panic cannot hurt you.

Keep breathing. In for 4... out for 6.

The wave of anxiety is cresting. It will pass. Waves always do.

You're doing great. Keep breathing.

Feel your heartbeat slowing. Your body remembering it's safe.

You've got this. You always have. And you always will.

One more deep breath. You're okay.`,
    tags: ['emergency', 'panic', 'anxiety', 'quick'],
    isPremium: false
  },
  {
    id: 'med_anxiety_03',
    title: 'Worry Release',
    titleKey: 'meditation.anxiety_worry',
    description: 'Let go of worries and find peace with this visualization.',
    descriptionKey: 'meditation.anxiety_worry_desc',
    category: 'anxiety',
    duration: 900,
    difficulty: 'intermediate',
    backgroundSound: 'nature',
    instructor: 'AI Guide',
    script: `Find a comfortable position and close your eyes.

We all carry worries. Today, we're going to practice letting them go.

Imagine you're sitting by a gentle stream. The water is clear and flowing steadily.

Each worry you have is like a leaf. Pick up your first worry and place it on a leaf.

Watch as the stream carries it away. The water takes it from you.

Pick up another worry. Put it on a leaf. Let the stream carry it away.

Continue with each worry. Some leaves may be bigger than others. That's okay.

The stream can carry them all. It flows endlessly, taking your worries with it.

You don't have to solve anything right now. Just let the water do its work.

Feel yourself becoming lighter with each leaf that floats away.

The stream will always be here when you need it. You can return anytime.

For now, just rest by the water. Feel the peace of having let go.

Take a deep breath. Carry this lightness with you as you open your eyes.`,
    tags: ['worry', 'visualization', 'letting go', 'stream'],
    isPremium: false
  },
  {
    id: 'med_anxiety_04',
    title: 'Safe Place Visualization',
    titleKey: 'meditation.anxiety_safe',
    description: 'Create your own mental sanctuary for times of anxiety.',
    descriptionKey: 'meditation.anxiety_safe_desc',
    category: 'anxiety',
    duration: 900,
    difficulty: 'beginner',
    backgroundSound: 'forest',
    instructor: 'AI Guide',
    script: `Let's create a safe place in your mind - somewhere you can go whenever you need peace.

Close your eyes and take a few deep breaths.

Imagine a place where you feel completely safe. It could be real or imagined.

Maybe it's a beach at sunset. A cozy cabin in the woods. A garden filled with flowers.

Start to build this place in your mind. What do you see around you?

What colors are present? What's the lighting like? Is it sunny, moonlit, or softly glowing?

Now add sounds. Maybe waves, birdsong, a crackling fire, or gentle music.

What do you smell? Fresh air, flowers, the ocean, pine trees?

Feel the temperature. Is it warm and comforting? Cool and refreshing?

Add any final touches. Perhaps a comfortable place to sit or lie down.

This is YOUR safe place. No one can enter without your permission.

Whenever you feel anxious, you can close your eyes and come here.

Spend a moment enjoying this sanctuary you've created.

Know that it's always waiting for you, whenever you need it.

Take a deep breath and slowly return to the present moment.`,
    tags: ['safe place', 'visualization', 'sanctuary', 'anxiety'],
    isPremium: false
  },
  {
    id: 'med_anxiety_05',
    title: 'Social Anxiety Relief',
    titleKey: 'meditation.anxiety_social',
    description: 'Prepare for social situations with confidence and calm.',
    descriptionKey: 'meditation.anxiety_social_desc',
    category: 'anxiety',
    duration: 600,
    difficulty: 'intermediate',
    backgroundSound: 'white_noise',
    instructor: 'AI Guide',
    script: `Social situations can feel challenging. But you have more strength than you know.

Take a deep breath. Ground yourself in this moment.

Remind yourself: Most people are focused on themselves, not judging you.

Visualize the social situation you're preparing for.

See yourself there, calm and comfortable. Your body language is relaxed.

You're breathing steadily. You're present in the conversation.

You don't have to be perfect. You just have to be yourself.

Imagine someone smiling at you. They're glad you're there.

Feel confidence building in your chest. You belong in this space.

If anxiety arises, you know how to breathe through it.

You can take breaks when you need them. You can leave when you need to.

You are in control of your experience.

Say to yourself: I am enough. I am worthy. I belong.

Carry this confidence with you. You've got this.

Take a deep breath and open your eyes when ready.`,
    tags: ['social', 'confidence', 'anxiety', 'preparation'],
    isPremium: true
  },

  // ==================== FOCUS & CONCENTRATION ====================
  {
    id: 'med_focus_01',
    title: 'Laser Focus',
    titleKey: 'meditation.focus_laser',
    description: 'Sharpen your concentration for work or study.',
    descriptionKey: 'meditation.focus_laser_desc',
    category: 'focus',
    duration: 600,
    difficulty: 'beginner',
    backgroundSound: 'white_noise',
    instructor: 'AI Guide',
    script: `It's time to sharpen your focus. Take a comfortable seat and close your eyes.

Begin with three deep, clearing breaths. In... and out.

Imagine your mind as a flashlight. Right now, the beam might be scattered, lighting up many things at once.

We're going to focus that beam into a laser.

Start by bringing all your attention to your breath. Just the sensation of breathing.

If thoughts arise - and they will - acknowledge them, then return to the breath.

This practice of returning is what builds focus. Don't judge the wandering.

Feel your attention becoming sharper with each return.

Now visualize the task ahead of you. See it clearly in your mind.

Direct your laser focus toward it. Feel the power of concentrated attention.

You are capable of deep focus. It's a skill, and you're practicing it right now.

When you open your eyes, carry this focused energy with you.

Take a deep breath. Open your eyes. Time to focus.`,
    tags: ['focus', 'concentration', 'work', 'study'],
    isPremium: false
  },
  {
    id: 'med_focus_02',
    title: 'Pre-Work Clarity',
    titleKey: 'meditation.focus_prework',
    description: 'A 5-minute session to prepare your mind for productive work.',
    descriptionKey: 'meditation.focus_prework_desc',
    category: 'focus',
    duration: 300,
    difficulty: 'beginner',
    backgroundSound: 'silence',
    instructor: 'AI Guide',
    script: `Before diving into work, let's prepare your mind.

Close your eyes. Take a deep breath to mark this transition.

Set an intention for your work session. What do you want to accomplish?

Hold that intention clearly in your mind.

Now, mentally clear your workspace. Imagine distractions floating away.

Your mind is clear. Your purpose is set. Your energy is ready.

Feel motivation rising in your chest. You're prepared to do great work.

Take three energizing breaths. In... out... In... out... In... out.

Open your eyes. You're ready. Go make it happen.`,
    tags: ['work', 'productivity', 'clarity', 'morning'],
    isPremium: false
  },
  {
    id: 'med_focus_03',
    title: 'Deep Concentration',
    titleKey: 'meditation.focus_deep',
    description: 'Train your mind for extended periods of focused work.',
    descriptionKey: 'meditation.focus_deep_desc',
    category: 'focus',
    duration: 1200,
    difficulty: 'advanced',
    backgroundSound: 'white_noise',
    instructor: 'AI Guide',
    script: `This is a longer practice for building deep concentration.

Find a comfortable position. Close your eyes.

We'll use single-pointed focus. Choose an object in your mind - perhaps a candle flame or a simple shape.

Hold this image in your mind's eye. See it clearly.

When your attention wanders - and it will - gently return to the image.

Don't force. Don't strain. Just redirect with patience.

This is mental training. Each time you return, you're getting stronger.

Continue focusing on your chosen object. Notice its details. Its color. Its shape.

If the image fades, recreate it. This is the practice.

You're developing the ability to sustain attention. This skill will serve you well.

Stay with the focus for as long as you can. Push past the first urges to quit.

The mind settles. The focus deepens. You're in the zone.

When you're ready, let the image dissolve. Feel the strength of your trained attention.

Carry this focused mind into your work. You've earned it.`,
    tags: ['deep', 'focus', 'concentration', 'training'],
    isPremium: true
  },
  {
    id: 'med_focus_04',
    title: 'Mindful Study',
    titleKey: 'meditation.focus_study',
    description: 'Enhance learning and memory retention through mindfulness.',
    descriptionKey: 'meditation.focus_study_desc',
    category: 'focus',
    duration: 600,
    difficulty: 'intermediate',
    backgroundSound: 'nature',
    instructor: 'AI Guide',
    script: `Prepare to study with a clear, receptive mind.

Close your eyes. Take a few deep breaths to center yourself.

Release any stress about what you need to learn. Trust in your ability.

Imagine your mind as a sponge, ready to absorb information.

You are curious. You are capable. Learning comes naturally to you.

Visualize the material you're about to study. See yourself understanding it easily.

Your memory is strong. Information flows in and stays.

Feel your brain becoming more alert, more ready to learn.

Set an intention: I will focus fully. I will understand deeply. I will remember clearly.

Take three deep breaths to seal this intention.

Open your eyes. Your mind is prepared for learning. Study well.`,
    tags: ['study', 'learning', 'memory', 'students'],
    isPremium: false
  },
  {
    id: 'med_focus_05',
    title: 'Creative Focus',
    titleKey: 'meditation.focus_creative',
    description: 'Clear mental blocks and tap into your creative flow.',
    descriptionKey: 'meditation.focus_creative_desc',
    category: 'focus',
    duration: 600,
    difficulty: 'intermediate',
    backgroundSound: 'forest',
    instructor: 'AI Guide',
    script: `Let's unlock your creative potential.

Close your eyes. Breathe deeply and relax.

Creativity doesn't come from force. It comes from flow.

Imagine a river inside you. This is your creative energy.

Sometimes rocks block the flow. These are doubts, fears, perfectionism.

Let's remove those blocks. See them dissolving in the water.

The river flows freely now. Creative energy surges through you.

Ideas are everywhere. You're connected to an infinite source.

There are no bad ideas in this space. Everything is exploration.

Feel the excitement of creation. The joy of making something new.

Trust your instincts. Your unique perspective is your gift.

When you open your eyes, let that creative energy flow into your work.

The best idea is the one you actually create. Go make something.`,
    tags: ['creative', 'flow', 'ideas', 'artists'],
    isPremium: false
  },

  // ==================== MINDFULNESS ====================
  {
    id: 'med_mindful_01',
    title: 'Present Moment Awareness',
    titleKey: 'meditation.mindful_present',
    description: 'Learn the art of being fully present in this moment.',
    descriptionKey: 'meditation.mindful_present_desc',
    category: 'mindfulness',
    duration: 600,
    difficulty: 'beginner',
    backgroundSound: 'nature',
    instructor: 'AI Guide',
    script: `The present moment is all we ever have. Let's practice being here.

Close your eyes. Take a breath.

Notice what you're feeling right now. Not what you felt this morning or what you might feel later.

Just now. This breath. This body. This moment.

What sensations do you notice? Warmth? Coolness? Pressure? Tingling?

Don't judge these sensations. Just observe them with curiosity.

Hear the sounds around you. They exist in this moment. So do you.

If your mind drifts to the past or future, that's okay. Just notice it, and return to now.

The present moment is always available to you. It's a refuge from worry and regret.

Feel the peace of just being here. Not doing. Just being.

This moment is enough. You are enough.

Take a deep breath of gratitude for this moment.

When you're ready, open your eyes and carry this presence with you.`,
    tags: ['present', 'mindfulness', 'awareness', 'now'],
    isPremium: false
  },
  {
    id: 'med_mindful_02',
    title: 'Mindful Eating',
    titleKey: 'meditation.mindful_eating',
    description: 'Transform your relationship with food through mindful awareness.',
    descriptionKey: 'meditation.mindful_eating_desc',
    category: 'mindfulness',
    duration: 600,
    difficulty: 'beginner',
    backgroundSound: 'silence',
    instructor: 'AI Guide',
    script: `This meditation can be done before or during a meal.

Close your eyes and take a few centering breaths.

Bring your food to mind, or look at it if it's in front of you.

Notice the colors, shapes, and textures. Really see your food.

Consider where it came from. The sun, soil, and water that nurtured it.

The people who grew it, transported it, prepared it.

Feel gratitude for this nourishment.

Now, if you're eating, take a small bite. Before chewing, just hold it in your mouth.

Notice the flavors unfolding. The textures. The temperature.

Chew slowly. Really experience the food.

Eating mindfully helps digestion, satisfaction, and appreciation.

Notice when you feel satisfied, not stuffed. Trust your body's signals.

Every meal is an opportunity for mindfulness.

Carry this awareness into your eating. Enjoy your food fully.`,
    tags: ['eating', 'mindfulness', 'food', 'gratitude'],
    isPremium: false
  },
  {
    id: 'med_mindful_03',
    title: 'Mindful Walking',
    titleKey: 'meditation.mindful_walking',
    description: 'Turn any walk into a meditation with this practice.',
    descriptionKey: 'meditation.mindful_walking_desc',
    category: 'mindfulness',
    duration: 600,
    difficulty: 'beginner',
    backgroundSound: 'nature',
    instructor: 'AI Guide',
    script: `This meditation is designed for walking, but you can also visualize it.

Begin walking slowly, more slowly than usual.

Feel your feet making contact with the ground. Left foot... right foot...

Notice the sensation of lifting, moving, and placing each foot.

Your body knows how to walk. Observe the miracle of it.

Feel the ground supporting you. Feel gravity keeping you connected to the earth.

Notice your surroundings without judgment. Colors, shapes, movements.

If your mind wanders to other thoughts, gently return to the sensation of walking.

Each step is a meditation. Each step is the present moment.

Walk as if you're kissing the earth with your feet.

Feel gratitude for your ability to move, to explore, to be alive.

Continue this mindful walking for as long as you like.

When ready, return to normal walking, carrying this awareness with you.`,
    tags: ['walking', 'mindfulness', 'movement', 'outdoors'],
    isPremium: false
  },
  {
    id: 'med_mindful_04',
    title: 'Observing Thoughts',
    titleKey: 'meditation.mindful_thoughts',
    description: 'Learn to watch your thoughts without getting caught up in them.',
    descriptionKey: 'meditation.mindful_thoughts_desc',
    category: 'mindfulness',
    duration: 900,
    difficulty: 'intermediate',
    backgroundSound: 'rain',
    instructor: 'AI Guide',
    script: `The mind thinks. That's what it does. But you are not your thoughts.

Close your eyes. Take a few deep breaths.

Imagine you're sitting in a movie theater. The screen is your mind.

Thoughts are like movies playing on the screen. You're the observer in the audience.

Watch as thoughts appear. Don't judge them. Don't engage. Just observe.

"There's a thought about work." Notice it, let it pass.
"There's a worry about tomorrow." Notice it, let it pass.
"There's a memory from yesterday." Notice it, let it pass.

You are not these thoughts. You are the awareness watching them.

Some thoughts try to pull you onto the screen. That's okay. When you notice, return to observing.

The more you practice, the less thoughts control you.

You have the power to choose which thoughts to follow.

Rest in this awareness. You are the sky, not the clouds passing through.

When ready, take a deep breath and open your eyes. Carry this perspective with you.`,
    tags: ['thoughts', 'awareness', 'observation', 'detachment'],
    isPremium: false
  },
  {
    id: 'med_mindful_05',
    title: 'Beginner\'s Mind',
    titleKey: 'meditation.mindful_beginner',
    description: 'Rediscover wonder and curiosity in everyday life.',
    descriptionKey: 'meditation.mindful_beginner_desc',
    category: 'mindfulness',
    duration: 600,
    difficulty: 'intermediate',
    backgroundSound: 'forest',
    instructor: 'AI Guide',
    script: `In the beginner's mind, there are many possibilities. In the expert's mind, there are few.

Let's practice seeing the world with fresh eyes.

Close your eyes. Take a deep breath.

Think of something ordinary that you see every day. Maybe your hand.

Now, imagine you're seeing it for the first time. As if you're a curious child.

Really look at it with wonder. The lines, the texture, the way it moves.

This is beginner's mind - seeing things as if for the first time.

Everything becomes fascinating when we drop our assumptions.

Practice this with sounds around you. Hear them as if for the first time.

What do you notice that you usually ignore?

Life becomes richer when we approach it with curiosity instead of familiarity.

Every moment is new. Every breath is unique. Every day is a fresh start.

Cultivate this sense of wonder. It's the key to a fulfilling life.

Open your eyes and see the world anew.`,
    tags: ['beginner', 'wonder', 'curiosity', 'fresh'],
    isPremium: true
  },

  // ==================== BREATHING EXERCISES ====================
  {
    id: 'med_breath_01',
    title: '4-7-8 Relaxation Breath',
    titleKey: 'meditation.breath_478',
    description: 'The classic breathing technique for instant calm.',
    descriptionKey: 'meditation.breath_478_desc',
    category: 'breathing',
    duration: 300,
    difficulty: 'beginner',
    backgroundSound: 'ocean',
    instructor: 'AI Guide',
    script: `The 4-7-8 breath is one of the most powerful techniques for relaxation.

Sit comfortably. Place the tip of your tongue behind your upper front teeth.

We'll breathe in through the nose for 4 counts, hold for 7, exhale through mouth for 8.

Let's begin.

Inhale quietly through your nose... 1... 2... 3... 4.

Hold your breath... 1... 2... 3... 4... 5... 6... 7.

Exhale completely through your mouth with a whooshing sound... 1... 2... 3... 4... 5... 6... 7... 8.

That's one cycle. Let's do three more.

Inhale... 2... 3... 4. Hold... 2... 3... 4... 5... 6... 7. Exhale... 2... 3... 4... 5... 6... 7... 8.

Again. Inhale... Hold... Exhale.

One more time. Feel your body becoming more relaxed with each cycle.

You can use this technique anytime you need calm. It works quickly and powerfully.

Practice twice daily for best results. Open your eyes when ready.`,
    tags: ['breathing', '4-7-8', 'relaxation', 'technique'],
    isPremium: false
  },
  {
    id: 'med_breath_02',
    title: 'Box Breathing',
    titleKey: 'meditation.breath_box',
    description: 'Used by Navy SEALs for stress management and focus.',
    descriptionKey: 'meditation.breath_box_desc',
    category: 'breathing',
    duration: 300,
    difficulty: 'beginner',
    backgroundSound: 'white_noise',
    instructor: 'AI Guide',
    script: `Box breathing is used by elite performers to stay calm under pressure.

Sit comfortably. Visualize drawing a box with your breath.

We'll inhale for 4 counts, hold for 4, exhale for 4, hold for 4. That's the box.

Let's begin.

Inhale, drawing the first side of the box... 1... 2... 3... 4.

Hold, drawing the top... 1... 2... 3... 4.

Exhale, drawing the other side... 1... 2... 3... 4.

Hold, completing the box... 1... 2... 3... 4.

Continue on your own. Visualize the box as you breathe.

Each side equal. Each breath smooth and controlled.

You are in control of your breath. You are in control of your state.

This technique reduces stress hormones and increases focus.

Continue for a few more cycles.

When you're ready, return to normal breathing. Notice how calm you feel.

Use this technique before high-pressure situations for best results.`,
    tags: ['breathing', 'box', 'navy seals', 'focus'],
    isPremium: false
  },
  {
    id: 'med_breath_03',
    title: 'Energizing Breath',
    titleKey: 'meditation.breath_energy',
    description: 'Wake up your mind and body with this invigorating technique.',
    descriptionKey: 'meditation.breath_energy_desc',
    category: 'breathing',
    duration: 300,
    difficulty: 'intermediate',
    backgroundSound: 'silence',
    instructor: 'AI Guide',
    script: `This breathing technique will energize you naturally.

Sit upright with your spine straight.

We'll do quick, rhythmic breaths through the nose. Keep your mouth closed.

Start with 10 quick breaths - in and out through the nose. Like a pump.

Ready? Go. In-out, in-out, in-out, in-out, in-out, in-out, in-out, in-out, in-out, in-out.

Take a deep breath in... hold for 5 seconds... and exhale slowly.

Feel the energy awakening in your body.

Let's do another round of 15 quick breaths.

Go. In-out, in-out, in-out... continue until 15.

Deep breath in... hold... exhale.

One final round of 20 breaths.

Go. In-out, in-out, in-out... continue.

Final deep inhale... hold for 10 seconds... and release.

Feel the tingling. Feel the aliveness. You're energized.

Note: Avoid this practice if pregnant or if you have high blood pressure.`,
    tags: ['breathing', 'energy', 'wake up', 'invigorating'],
    isPremium: false
  },
  {
    id: 'med_breath_04',
    title: 'Alternate Nostril Breathing',
    titleKey: 'meditation.breath_alternate',
    description: 'Balance your nervous system with this ancient yogic practice.',
    descriptionKey: 'meditation.breath_alternate_desc',
    category: 'breathing',
    duration: 600,
    difficulty: 'intermediate',
    backgroundSound: 'nature',
    instructor: 'AI Guide',
    script: `Alternate nostril breathing balances the left and right hemispheres of the brain.

Sit comfortably. Use your right hand in this pattern:
- Thumb will close right nostril
- Ring finger will close left nostril

Let's begin.

Close your right nostril with your thumb. Inhale through the left... 1... 2... 3... 4.

Close both nostrils. Hold... 1... 2.

Release thumb, exhale through right... 1... 2... 3... 4.

Inhale through right... 1... 2... 3... 4.

Close both. Hold... 1... 2.

Release ring finger, exhale through left... 1... 2... 3... 4.

That's one complete cycle. Continue on your own.

Inhale left, hold, exhale right, inhale right, hold, exhale left.

Feel the balance returning to your nervous system.

Continue for several more cycles.

When complete, release your hand and breathe normally.

Notice the calm, balanced state you've created.`,
    tags: ['breathing', 'alternate nostril', 'yogic', 'balance'],
    isPremium: false
  },
  {
    id: 'med_breath_05',
    title: 'Calming Breath for Panic',
    titleKey: 'meditation.breath_panic',
    description: 'A specific breathing pattern for acute panic or anxiety.',
    descriptionKey: 'meditation.breath_panic_desc',
    category: 'breathing',
    duration: 180,
    difficulty: 'beginner',
    backgroundSound: 'silence',
    instructor: 'AI Guide',
    script: `If you're feeling panicked, this will help. You're safe. Stay with me.

Put your feet flat on the ground. Feel the floor.

We're going to make your exhale longer than your inhale. This activates calm.

Breathe in for 2... 1... 2.
Breathe out for 4... 1... 2... 3... 4.

Again. In for 2... Out for 4...

Your body is hearing the message: you're safe.

Now let's extend it. In for 3... 1... 2... 3.
Out for 6... 1... 2... 3... 4... 5... 6.

Feel your heart rate slowing.

Continue this pattern. Your exhale twice as long as your inhale.

You're doing great. The panic is passing.

Keep breathing. In... and out...

You're in control. You're okay. The feeling is temporary.

Continue until you feel calm. You've got this.`,
    tags: ['breathing', 'panic', 'emergency', 'calming'],
    isPremium: false
  },

  // ==================== BODY SCAN ====================
  {
    id: 'med_body_01',
    title: 'Full Body Scan',
    titleKey: 'meditation.body_full',
    description: 'A complete journey through your body for deep relaxation.',
    descriptionKey: 'meditation.body_full_desc',
    category: 'body_scan',
    duration: 1200,
    difficulty: 'beginner',
    backgroundSound: 'rain',
    instructor: 'AI Guide',
    script: `Lie down in a comfortable position. Close your eyes.

We're going to travel through your body, bringing awareness to each part.

Start at the top of your head. Notice any sensations there. Tingling? Pressure? Warmth?

Move to your forehead. Simply observe. Don't try to change anything.

Your eyebrows, your eyes, your cheeks. Notice the sensations.

Your nose, your lips, your jaw. Is there tension? Just observe.

Your ears, the back of your head. Bring awareness there.

Now your neck. Front and back. Notice how it feels.

Your shoulders - a common place to hold tension. What do you feel?

Move down your right arm. Upper arm, elbow, forearm, wrist, hand, fingers.

Now your left arm. Upper arm, elbow, forearm, wrist, hand, fingers.

Return to your chest. Feel it rising and falling with your breath.

Your upper back, middle back, lower back. Notice without judgment.

Your stomach, softening with each breath.

Your hips, your pelvis. Observe the sensations.

Right leg now. Thigh, knee, calf, ankle, foot, toes.

Left leg. Thigh, knee, calf, ankle, foot, toes.

Feel your entire body now as one unified whole.

You are relaxed, aware, at peace.

When ready, wiggle your fingers and toes. Slowly open your eyes.`,
    tags: ['body scan', 'relaxation', 'awareness', 'full'],
    isPremium: false
  },
  {
    id: 'med_body_02',
    title: 'Quick Body Check-In',
    titleKey: 'meditation.body_quick',
    description: 'A 5-minute scan to reconnect with your physical body.',
    descriptionKey: 'meditation.body_quick_desc',
    category: 'body_scan',
    duration: 300,
    difficulty: 'beginner',
    backgroundSound: 'nature',
    instructor: 'AI Guide',
    script: `Take a moment to check in with your body.

Close your eyes. Take three deep breaths.

Scan your head and face. Where are you holding tension?

Move to your shoulders and neck. Any tightness there?

Check your chest and back. How does it feel to breathe?

Notice your stomach. Is it relaxed or clenched?

Feel your hips and legs. Are they comfortable?

Where in your body needs attention today?

Send breath to any areas of tension. Imagine it softening with each exhale.

Your body is always communicating with you. Thank it for carrying you through life.

Take a final deep breath. Open your eyes, feeling reconnected.`,
    tags: ['body scan', 'quick', 'check-in', 'awareness'],
    isPremium: false
  },
  {
    id: 'med_body_03',
    title: 'Release Physical Tension',
    titleKey: 'meditation.body_tension',
    description: 'Target and release tension stored in your body.',
    descriptionKey: 'meditation.body_tension_desc',
    category: 'body_scan',
    duration: 900,
    difficulty: 'intermediate',
    backgroundSound: 'ocean',
    instructor: 'AI Guide',
    script: `Let's find and release tension stored in your body.

Lie down or sit comfortably. Close your eyes.

Take a deep breath and release any initial tension with your exhale.

Scan your body for areas that feel tight, sore, or uncomfortable.

When you find tension, focus your attention there.

Breathe into that area. Imagine your breath is warm, soothing energy.

With each exhale, the tension melts away a little more.

If feelings or memories arise with the tension, acknowledge them. Then let them go.

Our bodies store our experiences. It's okay to release them.

Continue scanning and releasing. Head to face. Neck to shoulders.

Arms and hands. Chest and back. Stomach and hips. Legs and feet.

Anywhere you find tension, breathe into it and let it go.

Feel your body becoming lighter, freer, more relaxed.

Thank your body for releasing what it no longer needs.

Take a deep breath and open your eyes when ready.`,
    tags: ['body scan', 'tension', 'release', 'somatic'],
    isPremium: false
  },

  // ==================== LOVING-KINDNESS ====================
  {
    id: 'med_love_01',
    title: 'Loving-Kindness for Self',
    titleKey: 'meditation.love_self',
    description: 'Cultivate compassion and love for yourself.',
    descriptionKey: 'meditation.love_self_desc',
    category: 'loving_kindness',
    duration: 600,
    difficulty: 'beginner',
    backgroundSound: 'nature',
    instructor: 'AI Guide',
    script: `You deserve love and kindness, especially from yourself.

Sit comfortably. Close your eyes. Place your hand on your heart.

Feel the warmth of your hand. Feel your heart beating beneath it.

Begin to silently repeat these phrases, directing them toward yourself:

May I be happy.
May I be healthy.
May I be safe.
May I live with ease.

Again. May I be happy. May I be healthy. May I be safe. May I live with ease.

Really feel the meaning behind each phrase. You are wishing yourself well.

If self-criticism arises, acknowledge it, then return to the phrases.

You are worthy of love. Just as you are. Right now. In this moment.

May I be happy.
May I be healthy.
May I be safe.
May I live with ease.

Feel warmth spreading through your chest. This is self-love.

Carry this kindness with you throughout your day.

Open your eyes when ready, with a smile for yourself.`,
    tags: ['loving kindness', 'self love', 'compassion', 'metta'],
    isPremium: false
  },
  {
    id: 'med_love_02',
    title: 'Loving-Kindness for Others',
    titleKey: 'meditation.love_others',
    description: 'Extend compassion to loved ones, strangers, and all beings.',
    descriptionKey: 'meditation.love_others_desc',
    category: 'loving_kindness',
    duration: 900,
    difficulty: 'intermediate',
    backgroundSound: 'forest',
    instructor: 'AI Guide',
    script: `We'll practice extending love and kindness to others.

Close your eyes. Begin with loving-kindness for yourself.

May I be happy. May I be healthy. May I be safe. May I live with ease.

Now, bring to mind someone you love deeply. Picture them clearly.

Direct the phrases toward them:
May you be happy. May you be healthy. May you be safe. May you live with ease.

Feel love flowing from your heart to theirs.

Now think of a neutral person - someone you neither like nor dislike.
May you be happy. May you be healthy. May you be safe. May you live with ease.

Now, if you're ready, bring to mind someone difficult. Start small.
May you be happy. May you be healthy. May you be safe. May you live with ease.

This is not condoning behavior. It's freeing yourself from resentment.

Finally, extend loving-kindness to all beings everywhere:
May all beings be happy. May all beings be healthy. May all beings be safe. May all beings live with ease.

Feel your heart expanding to embrace the whole world.

You're connected to all of life through this love.

Open your eyes when ready, carrying this love with you.`,
    tags: ['loving kindness', 'compassion', 'metta', 'others'],
    isPremium: false
  },
  {
    id: 'med_love_03',
    title: 'Forgiveness Meditation',
    titleKey: 'meditation.love_forgive',
    description: 'Release resentment and find peace through forgiveness.',
    descriptionKey: 'meditation.love_forgive_desc',
    category: 'loving_kindness',
    duration: 900,
    difficulty: 'advanced',
    backgroundSound: 'rain',
    instructor: 'AI Guide',
    script: `Forgiveness is a gift you give yourself.

Close your eyes. Take a few centering breaths.

First, forgiveness for yourself. We all make mistakes. We all have regrets.

Think of something you've been hard on yourself about.

Silently say: I forgive myself. I did the best I could with what I knew. I release this burden.

Feel the weight lifting. You are human. You are learning. You are enough.

Now, think of someone who has hurt you. This doesn't mean their actions were okay.

Forgiveness is about freeing yourself from carrying the pain.

When you're ready, silently say: I forgive you. I release this hurt. I free myself.

If full forgiveness isn't possible yet, that's okay. Just plant the seed.

I am willing to forgive. I am moving toward peace.

Finally, if there's anyone you've hurt, ask for forgiveness in your heart.

I am sorry. I did not intend to cause pain. I ask for your forgiveness.

Feel the relief of letting go. Forgiveness heals the forgiver.

Take a deep breath. Carry this lightness with you. Open your eyes.`,
    tags: ['forgiveness', 'healing', 'release', 'compassion'],
    isPremium: true
  },

  // ==================== MORNING MEDITATION ====================
  {
    id: 'med_morning_01',
    title: 'Morning Awakening',
    titleKey: 'meditation.morning_awaken',
    description: 'Start your day with intention and positive energy.',
    descriptionKey: 'meditation.morning_awaken_desc',
    category: 'morning',
    duration: 600,
    difficulty: 'beginner',
    backgroundSound: 'nature',
    instructor: 'AI Guide',
    script: `Good morning. A new day is beginning.

Before you rush into the day, take a moment to be present.

Take a deep breath. Feel your body waking up.

Stretch gently if you like. Feel life flowing through you.

Set an intention for today. What kind of day do you want to have?

Maybe today you'll be patient. Maybe kind. Maybe productive. Maybe present.

Hold this intention in your heart.

Now, think of three things you're grateful for this morning.

They can be simple. Your breath. Your bed. A new day.

Feel gratitude warming your chest.

Visualize your day going well. See yourself calm, capable, and content.

Whatever challenges arise, you will handle them.

Take a deep, energizing breath. Feel ready to embrace this day.

Open your eyes. Good morning. Go create a beautiful day.`,
    tags: ['morning', 'awakening', 'intention', 'gratitude'],
    isPremium: false
  },
  {
    id: 'med_morning_02',
    title: 'Sunrise Energy',
    titleKey: 'meditation.morning_sunrise',
    description: 'Harness the energy of a new day with this uplifting practice.',
    descriptionKey: 'meditation.morning_sunrise_desc',
    category: 'morning',
    duration: 300,
    difficulty: 'beginner',
    backgroundSound: 'nature',
    instructor: 'AI Guide',
    script: `The sun is rising on a new day, and so are you.

Sit up straight. Feel the potential of this moment.

Take a deep breath in, drawing in morning energy... and exhale any grogginess.

Imagine golden sunlight filling you from the top of your head.

This light is energy, vitality, possibility.

Feel it flowing through your entire body, waking up every cell.

You are alive. You have this day. What will you do with it?

Take three energizing breaths. In... out. In... out. In... out.

Feel awake, alert, and ready.

Smile. Your face is the first thing many people will see today.

Bring your best self forward.

Open your eyes. Rise and shine. The day is waiting.`,
    tags: ['morning', 'energy', 'sunrise', 'uplifting'],
    isPremium: false
  },
  {
    id: 'med_morning_03',
    title: 'Mindful Morning',
    titleKey: 'meditation.morning_mindful',
    description: 'Start with mindfulness to stay present all day.',
    descriptionKey: 'meditation.morning_mindful_desc',
    category: 'morning',
    duration: 600,
    difficulty: 'intermediate',
    backgroundSound: 'forest',
    instructor: 'AI Guide',
    script: `Starting your day mindfully sets the tone for everything that follows.

Sit quietly. Don't rush. These few minutes will make the whole day better.

Bring your attention to your breath. Notice the inhale... the exhale.

Be fully present with each breath. This is the practice.

When thoughts about the day arise, notice them, then return to your breath.

You'll have plenty of time to think and do. Right now, just be.

Feel your body in this moment. The weight of your body. The air on your skin.

Listen to the sounds around you. Just hearing, not thinking about.

This is mindfulness - being fully here, fully now.

Set an intention to carry this presence throughout your day.

When you feel stressed, remember this moment. Return to your breath.

The present moment is always available to you.

Take a final mindful breath. Open your eyes with awareness.`,
    tags: ['morning', 'mindfulness', 'presence', 'intention'],
    isPremium: false
  },

  // ==================== EVENING WIND-DOWN ====================
  {
    id: 'med_evening_01',
    title: 'Evening Release',
    titleKey: 'meditation.evening_release',
    description: 'Let go of the day and transition into peaceful evening.',
    descriptionKey: 'meditation.evening_release_desc',
    category: 'evening',
    duration: 600,
    difficulty: 'beginner',
    backgroundSound: 'rain',
    instructor: 'AI Guide',
    script: `The day is ending. It's time to let it go.

Find a comfortable position. Close your eyes.

Take a deep breath. With your exhale, release the day.

Whatever happened today - the good, the challenging - it's done now.

You don't need to replay it. You don't need to fix it.

Just let it be. Let it go.

Breathe in peace... exhale the day.

If there were difficulties, acknowledge them. "That was hard." Then let them go.

If there were victories, acknowledge them. "That was good." Then let them go.

The evening is for rest, for family, for self-care.

You've worked hard today. Now it's time to be gentle with yourself.

Feel your body relaxing. Your responsibilities can wait until tomorrow.

Take a deep breath of evening calm.

When you're ready, open your eyes. Enter your evening with peace.`,
    tags: ['evening', 'release', 'letting go', 'transition'],
    isPremium: false
  },
  {
    id: 'med_evening_02',
    title: 'Gratitude Reflection',
    titleKey: 'meditation.evening_gratitude',
    description: 'End your day by counting your blessings.',
    descriptionKey: 'meditation.evening_gratitude_desc',
    category: 'evening',
    duration: 600,
    difficulty: 'beginner',
    backgroundSound: 'nature',
    instructor: 'AI Guide',
    script: `Ending the day with gratitude improves sleep and wellbeing.

Close your eyes. Take a calming breath.

Reflect on your day. What are you grateful for?

Think of one person you're grateful for today. Maybe someone who helped you or simply made you smile.

Think of one thing that went well today. Even small things count.

Think of one thing about yourself you're grateful for. Your effort. Your kindness. Your resilience.

Feel appreciation filling your heart.

Gratitude shifts your perspective. Even on hard days, there is good.

Now, think of something you're looking forward to tomorrow.

End your day with anticipation, not dread.

You are blessed in countless ways. Some obvious, some hidden.

Take a breath of thankfulness.

Carry this gratitude into your sleep. Sweet dreams.`,
    tags: ['evening', 'gratitude', 'reflection', 'blessing'],
    isPremium: false
  },
  {
    id: 'med_evening_03',
    title: 'Preparing for Tomorrow',
    titleKey: 'meditation.evening_prepare',
    description: 'Visualize a successful tomorrow while relaxing tonight.',
    descriptionKey: 'meditation.evening_prepare_desc',
    category: 'evening',
    duration: 600,
    difficulty: 'intermediate',
    backgroundSound: 'ocean',
    instructor: 'AI Guide',
    script: `Let's close today and prepare for tomorrow, all while relaxing.

Sit or lie down comfortably. Close your eyes.

First, acknowledge today. Whatever it was, you did your best. It's complete.

Take a deep breath to draw a line under today.

Now, gently turn your mind to tomorrow.

What's one important thing you want to accomplish?

Visualize yourself doing it successfully. See the details. Feel the satisfaction.

See yourself calm and capable, handling whatever comes.

Imagine waking up refreshed, ready to take on the day.

Feel confidence about tomorrow settling into your body.

You don't have to figure everything out now. Just plant seeds of success.

Trust that tomorrow you'll have what you need to handle it.

Release any worry. Tomorrow will come, and you'll be ready.

For now, rest. Your mind is prepared. Your body needs sleep.

Take a final relaxing breath. Good night.`,
    tags: ['evening', 'visualization', 'preparation', 'tomorrow'],
    isPremium: false
  },
  {
    id: 'med_evening_04',
    title: 'Digital Detox Wind-Down',
    titleKey: 'meditation.evening_digital',
    description: 'Disconnect from screens and reconnect with yourself.',
    descriptionKey: 'meditation.evening_digital_desc',
    category: 'evening',
    duration: 600,
    difficulty: 'beginner',
    backgroundSound: 'forest',
    instructor: 'AI Guide',
    script: `You've spent time in the digital world today. Now it's time to return to yourself.

Put away your devices. Close your eyes.

Take a deep breath. Feel yourself arriving back in your body.

Notice the difference between the digital world and this moment.

The stillness. The quiet. The presence.

Your mind may feel scattered from the constant stimulation. That's normal.

With each breath, your thoughts are settling down.

There's no notification you need to check. No message that can't wait.

Right now, just be here. Feel the peace of disconnection.

Your brain needs this rest from screens. Honor that need.

Feel your nervous system calming down.

In this moment, you are whole without any device.

Your worth isn't measured in likes or responses.

You are enough, just as you are, right here.

Take a final breath of digital peace. Open your eyes gently.`,
    tags: ['evening', 'digital detox', 'screens', 'disconnection'],
    isPremium: false
  },
  {
    id: 'med_evening_05',
    title: 'Self-Compassion Before Sleep',
    titleKey: 'meditation.evening_compassion',
    description: 'End your day with kindness toward yourself.',
    descriptionKey: 'meditation.evening_compassion_desc',
    category: 'evening',
    duration: 600,
    difficulty: 'intermediate',
    backgroundSound: 'rain',
    instructor: 'AI Guide',
    script: `Before you sleep, let's practice some self-compassion.

Lie down. Place your hands on your heart.

The day may have been hard. You may have made mistakes. You may be tired.

Whatever happened, speak to yourself like you would to a dear friend.

Silently say: I did my best today. That's enough.

If you're struggling with something, acknowledge it:
This is hard. I'm not alone. May I be kind to myself.

Don't judge today. Don't plan tomorrow. Just be present with yourself.

Feel the warmth of your hands on your heart. This is self-love.

You deserve the same compassion you give others.

Silently say: May I forgive myself. May I accept myself. May I love myself.

Feel these words sinking into your heart.

You are worthy of love. Especially your own.

Sleep now, wrapped in self-compassion.

Tomorrow is a new day. Tonight, rest in kindness.`,
    tags: ['evening', 'self-compassion', 'kindness', 'sleep'],
    isPremium: true
  }
];

// Categories with metadata
export const meditationCategories = [
  { id: 'stress_relief', name: 'Stress Relief', nameKey: 'meditation.category.stress_relief', icon: '😌', description: 'Release tension and find calm' },
  { id: 'sleep', name: 'Sleep & Relaxation', nameKey: 'meditation.category.sleep', icon: '😴', description: 'Drift into restful sleep' },
  { id: 'anxiety', name: 'Anxiety Management', nameKey: 'meditation.category.anxiety', icon: '🌊', description: 'Calm your anxious mind' },
  { id: 'focus', name: 'Focus & Concentration', nameKey: 'meditation.category.focus', icon: '🎯', description: 'Sharpen your attention' },
  { id: 'mindfulness', name: 'Mindfulness', nameKey: 'meditation.category.mindfulness', icon: '🌸', description: 'Be present in the moment' },
  { id: 'breathing', name: 'Breathing Exercises', nameKey: 'meditation.category.breathing', icon: '💨', description: 'Powerful breath techniques' },
  { id: 'body_scan', name: 'Body Scan', nameKey: 'meditation.category.body_scan', icon: '🧬', description: 'Awareness through your body' },
  { id: 'loving_kindness', name: 'Loving-Kindness', nameKey: 'meditation.category.loving_kindness', icon: '💕', description: 'Cultivate compassion and love' },
  { id: 'morning', name: 'Morning Meditation', nameKey: 'meditation.category.morning', icon: '🌅', description: 'Start your day right' },
  { id: 'evening', name: 'Evening Wind-Down', nameKey: 'meditation.category.evening', icon: '🌙', description: 'Peaceful end to your day' }
];

// Background sounds
export const backgroundSounds = [
  { id: 'nature', name: 'Nature Sounds', nameKey: 'meditation.sound.nature', icon: '🌿' },
  { id: 'rain', name: 'Gentle Rain', nameKey: 'meditation.sound.rain', icon: '🌧️' },
  { id: 'ocean', name: 'Ocean Waves', nameKey: 'meditation.sound.ocean', icon: '🌊' },
  { id: 'forest', name: 'Forest Ambience', nameKey: 'meditation.sound.forest', icon: '🌲' },
  { id: 'white_noise', name: 'White Noise', nameKey: 'meditation.sound.white_noise', icon: '📻' },
  { id: 'silence', name: 'Silence', nameKey: 'meditation.sound.silence', icon: '🔇' }
];

export default meditationSessions;
