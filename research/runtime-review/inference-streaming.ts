// Source: jigjoy-ai/mozaik commit 8f6b198cfae64026b157a17ed054a0d459abae76 (MIT).
// Type-only dependency imports omitted for an isolated control-flow check.

export class InferenceStreamingState implements LoopState<InferenceInput, LoopStateExecution<"inference_streaming">> {
	readonly id = "inference_streaming"

	constructor(private readonly inferenceRunner: InferenceRunner) {}

	async run(input: InferenceInput, loopVisitor: LoopVisitor): Promise<LoopStateExecution<"inference_streaming">> {
		loopVisitor.visitInferenceStarted(input)

		let output: InferenceOutput | undefined = undefined

		for await (const event of this.inferenceRunner.stream(input)) {
			loopVisitor.visitInferenceEvent(event)

			if (event.type === "inference.output") {
				output = event.payload as InferenceOutput
			}
		}

		if (!output) {
			throw new Error("Inference output not found")
		}

		loopVisitor.visitInferenceCompleted(output)

		return {
			stateId: "inference_streaming",
			input,
			output,
		}
	}
}

