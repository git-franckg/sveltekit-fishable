<script lang="ts">
  import type { PageProps } from './$types.js';

  const { data }: PageProps = $props();
</script>

<form method="POST">
  <input type="text" name="username" value={data.username} />
  <button type="submit">Submit</button>
</form>
