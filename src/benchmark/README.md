# LID

```
Running 30s test @ http://localhost:3000/user/123?size=10&page=10
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   164.62ms  156.61ms 865.43ms   84.14%
    Req/Sec   334.95    144.51   656.00     67.24%
  93401 requests in 30.12s, 17.19MB read
  Socket errors: connect 0, read 892, write 0, timeout 0
Requests/sec:   3100.94
Transfer/sec:    584.45KB
```

# EXPRESS

```
Running 30s test @ http://localhost:3000/user/123?size=10&page=10
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   187.75ms   79.13ms 596.07ms   83.72%
    Req/Sec   190.82     79.60   333.00     62.86%
  63802 requests in 30.10s, 18.92MB read
  Socket errors: connect 0, read 597, write 0, timeout 0
Requests/sec:   2119.86
Transfer/sec:    643.82KB
```

# FASTIFY

```
Running 30s test @ http://localhost:3000/user/123?size=10&page=10
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   146.58ms  115.79ms 679.47ms   79.35%
    Req/Sec   311.73    193.56   790.00     56.68%
  89545 requests in 30.10s, 18.27MB read
  Socket errors: connect 0, read 569, write 0, timeout 0
Requests/sec:   2974.49
Transfer/sec:    621.62KB
```
