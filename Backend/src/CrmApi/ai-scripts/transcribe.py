import argparse
import json
import os
import sys


def _setup_ffmpeg():
    try:
        import imageio_ffmpeg
        ffmpeg_dir = os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())
        if ffmpeg_dir not in os.environ.get("PATH", ""):
            os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
    except Exception:
        pass


def main():
    _setup_ffmpeg()

    parser = argparse.ArgumentParser(description="Transcription Whisper (faster-whisper)")
    parser.add_argument("audio_path", help="Chemin du fichier audio a transcrire")
    parser.add_argument("--model", default="base", help="Taille du modele Whisper (tiny, base, small, medium, large)")
    parser.add_argument("--language", default="fr", help="Langue de la transcription")
    parser.add_argument("--device", default="auto", help="Peripherique: auto, cpu ou cuda")
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel

        if args.device == "auto":
            device = "cuda"
            try:
                import torch  # noqa: F401
                if not torch.cuda.is_available():
                    device = "cpu"
            except Exception:
                device = "cpu"
        else:
            device = args.device

        model = WhisperModel(args.model, device=device, compute_type="auto")
        segments, info = model.transcribe(
            args.audio_path,
            language=args.language,
            beam_size=5,
            vad_filter=True,
        )

        text = "".join(segment.text for segment in segments).strip()

        print(json.dumps(
            {
                "success": True,
                "text": text,
                "language": info.language,
                "duration": info.duration,
            },
            ensure_ascii=False,
        ))
        return 0
    except Exception as exc:
        print(json.dumps({"success": False, "error": str(exc)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    sys.exit(main())
