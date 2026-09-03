import asyncio
import uuid
import time
from typing import Dict, Any, Callable, Coroutine

class AsyncTaskQueue:
    """
    Layer 4: Distributed Task Queue & Asynchronous Multi-Node Worker Pool.
    Decouples long-running DAST/PCAP scans from HTTP threads, preventing API freezes
    and supporting non-blocking parallel job scheduling with status lifecycle states.
    """
    def __init__(self, max_concurrent_workers: int = 8):
        self.max_workers = max_concurrent_workers
        self.job_registry: Dict[str, Dict[str, Any]] = {}
        self.semaphore = asyncio.Semaphore(max_concurrent_workers)

    def register_job(self, job_type: str, target: str) -> str:
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        self.job_registry[job_id] = {
            "id": job_id,
            "type": job_type,
            "target": target,
            "status": "queued",
            "progress": 0,
            "created_at": time.time(),
            "started_at": None,
            "completed_at": None,
            "result": None,
            "error": None
        }
        return job_id

    async def dispatch_job(self, job_id: str, async_task_fn: Callable[[], Coroutine[Any, Any, Any]]):
        async with self.semaphore:
            if job_id not in self.job_registry:
                return

            self.job_registry[job_id]["status"] = "running"
            self.job_registry[job_id]["started_at"] = time.time()
            self.job_registry[job_id]["progress"] = 10

            try:
                result = await async_task_fn()
                self.job_registry[job_id]["status"] = "completed"
                self.job_registry[job_id]["progress"] = 100
                self.job_registry[job_id]["completed_at"] = time.time()
                self.job_registry[job_id]["result"] = result
            except Exception as e:
                self.job_registry[job_id]["status"] = "failed"
                self.job_registry[job_id]["completed_at"] = time.time()
                self.job_registry[job_id]["error"] = str(e)

    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        return self.job_registry.get(job_id, {"status": "not_found"})

# Global Task Queue
task_queue = AsyncTaskQueue(max_concurrent_workers=16)
