<script lang="ts">
	import type { RouterExample, RouterFollowUp } from "$lib/constants/routerExamples";
	import CarbonDirectionRight from "~icons/carbon/direction-right-01";

	interface Props {
		examples?: RouterExample[];
		followUps?: RouterFollowUp[];
		onExampleClick?: (example: RouterExample) => void;
		onFollowUpClick?: (followUp: RouterFollowUp) => void;
	}

	let {
		examples = [],
		followUps = [],
		onExampleClick,
		onFollowUpClick,
	}: Props = $props();
</script>

{#if examples.length > 0}
	<div
		class="no-scrollbar mb-3 flex w-full select-none justify-start gap-2 overflow-x-auto whitespace-nowrap text-gray-400 dark:text-gray-500"
	>
		{#each examples as ex}
			<button
				class="flex items-center rounded-lg bg-gray-100/90 px-2 py-0.5 text-center text-sm backdrop-blur hover:text-gray-500 dark:bg-gray-700/50 dark:hover:text-gray-400"
				onclick={() => onExampleClick?.(ex)}>{ex.title}</button
			>
		{/each}
	</div>
{/if}

{#if followUps.length > 0}
	<div
		class="no-scrollbar mb-3 flex w-full select-none justify-start gap-2 overflow-x-auto whitespace-nowrap text-gray-400 dark:text-gray-500"
	>
		{#each followUps as followUp}
			<button
				class="flex items-center gap-1 rounded-lg bg-gray-100/90 px-2 py-0.5 text-center text-sm backdrop-blur hover:text-gray-500 dark:bg-gray-700/50 dark:hover:text-gray-400"
				onclick={() => onFollowUpClick?.(followUp)}
			>
				<CarbonDirectionRight class="scale-y-[-1] text-xs" />
				{followUp.title}</button
			>
		{/each}
	</div>
{/if}

