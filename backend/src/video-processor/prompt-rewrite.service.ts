import { Injectable } from '@nestjs/common';
import type {
  AspectRatio,
  CreateVideoProcessorRequest,
  VideoSpec,
} from './video-processor.types';

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

@Injectable()
export class PromptRewriteService {
  normalizeToSpec(
    rawPrompt: string,
    request: CreateVideoProcessorRequest,
  ): VideoSpec {
    const prompt = normalizeWhitespace(rawPrompt);
    const ratio = request.ratio ?? '16:9';

    const subject = this.inferSubject(prompt);
    const setting = this.inferSetting(prompt);
    const action = this.inferAction(prompt);
    const camera = this.inferCamera(prompt, ratio);
    const mood = this.inferMood(prompt);

    const constraints: string[] = [
      'no on-screen text',
      'no subtitles',
      'no watermark',
      'no logos',
      'no extra characters',
      'keep identity consistent',
      'stable background',
      'natural motion',
      'high detail, clean, cinematic lighting',
    ];

    return { subject, setting, action, camera, mood, constraints };
  }

  rewriteToPromptFinal(
    spec: VideoSpec,
    request: CreateVideoProcessorRequest,
  ): string {
    const ratio = request.ratio ?? '16:9';
    const durationSeconds = clampNumber(request.durationSeconds ?? 8, 1, 15);

    const base = [
      `A short ${durationSeconds}s video in ${ratio}.`,
      `Subject: ${spec.subject}.`,
      `Setting: ${spec.setting}.`,
      `Action: ${spec.action}.`,
      `Camera: ${spec.camera}.`,
      `Mood: ${spec.mood}.`,
      `Style: photoreal live-action look, realistic depth of field, polished cinematic lighting, natural skin tones.`,
      `Constraints: ${spec.constraints.join(', ')}.`,
    ];

    return normalizeWhitespace(base.join(' '));
  }

  toProjectYaml(params: {
    projectSlug: string;
    ratio: AspectRatio;
    locale: string;
    durationSeconds: number;
    promptFinal: string;
  }): string {
    const safeSlug = params.projectSlug.replace(/[^a-zA-Z0-9-_]/g, '-');

    return [
      'project:',
      `  slug: ${safeSlug}`,
      `  title: ${safeSlug}`,
      `  date: "${new Date().toISOString().slice(0, 10)}"`,
      'speaker:',
      '  name: GiftVerse',
      '  images: []',
      '  mode: single',
      'locales:',
      `  ${params.locale}:`,
      '    theme:',
      '      background: "#111111"',
      '      accent: "#ff6b35"',
      '      text: "#ffffff"',
      '    clips:',
      '      - id: main',
      '        source: generated',
      '        text: ""',
      `        durationSeconds: ${params.durationSeconds}`,
      'render:',
      `  aspectRatios: ["${params.ratio}"]`,
      '  fps: 30',
      '  outputDir: ./output',
      'generation:',
      '  model: v6',
      '  referenceModel: v6',
      '  quality: 720p',
      '  upscale: true',
      '  generateAudio: false',
      '  image:',
      '    enabled: false',
      '  prompt:',
      `    base: "${this.escapeYamlDoubleQuoted(params.promptFinal)}"`,
      '',
    ].join('\n');
  }

  private escapeYamlDoubleQuoted(input: string): string {
    return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  private inferSubject(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes('character') || p.includes('nhân vật'))
      return 'a single main character';
    if (p.includes('couple') || p.includes('cặp đôi')) return 'a couple';
    if (p.includes('cat') || p.includes('mèo')) return 'a cat';
    return 'a single subject';
  }

  private inferSetting(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes('studio')) return 'a clean photoreal studio';
    if (p.includes('office') || p.includes('văn phòng'))
      return 'a modern office';
    if (p.includes('beach') || p.includes('biển'))
      return 'a beach at golden hour';
    if (p.includes('city') || p.includes('thành phố'))
      return 'a cinematic city scene at night';
    return 'a photoreal environment';
  }

  private inferAction(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes('talk') || p.includes('nói'))
      return 'speaking directly to camera with natural gestures';
    if (p.includes('walk') || p.includes('đi')) return 'walking naturally';
    if (p.includes('smile') || p.includes('cười')) return 'smiling softly';
    return 'subtle natural motion';
  }

  private inferCamera(prompt: string, ratio: AspectRatio): string {
    const p = prompt.toLowerCase();
    if (p.includes('close')) return 'close-up, slow push in';
    if (p.includes('wide')) return 'wide shot, slow dolly';
    if (ratio === '9:16') return 'medium shot, vertical framing, slow push in';
    return 'medium shot, eye-level, slow push in';
  }

  private inferMood(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes('romantic') || p.includes('lãng mạn'))
      return 'warm, romantic, premium';
    if (p.includes('funny') || p.includes('vui'))
      return 'playful, light, charming';
    if (p.includes('sad') || p.includes('buồn'))
      return 'soft, emotional, intimate';
    if (p.includes('epic') || p.includes('hoành tráng'))
      return 'epic, cinematic, dramatic';
    return 'warm, cinematic, trustworthy';
  }
}
