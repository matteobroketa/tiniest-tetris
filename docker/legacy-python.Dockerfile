FROM debian/eol:squeeze

ARG PYTHON_VERSION
ARG ARCHIVE
ARG PREFIX=/opt/cpython

COPY docker/dist/${ARCHIVE} /tmp/${ARCHIVE}

RUN printf 'deb http://archive.debian.org/debian squeeze main\n' > /etc/apt/sources.list \
 && printf 'deb http://archive.debian.org/debian squeeze-lts main\n' >> /etc/apt/sources.list \
 && printf 'Acquire::Check-Valid-Until "false";\nAcquire::AllowInsecureRepositories "true";\n' > /etc/apt/apt.conf.d/99archive \
 && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::AllowInsecureRepositories=true update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --allow-unauthenticated --no-install-recommends \
      build-essential zlib1g-dev xz-utils \
 && cd /tmp \
 && case "${ARCHIVE}" in \
      *.tar.gz|*.tgz) tar xzf "${ARCHIVE}" ;; \
      *.tar.xz) tar xJf "${ARCHIVE}" ;; \
      *) echo "unsupported archive: ${ARCHIVE}" >&2; exit 2 ;; \
    esac \
 && cd "Python-${PYTHON_VERSION}" \
 && ./configure --prefix="${PREFIX}" \
 && if grep -q '^#zlib[[:space:]]' Modules/Setup; then \
      sed -i 's/^#zlib[[:space:]].*/zlib zlibmodule.c -lz/' Modules/Setup; \
    fi \
 && make -j2 \
 && make install \
 && "${PREFIX}/bin/python" -c 'import sys,zlib;print(sys.version);print(zlib.ZLIB_VERSION)' \
 && rm -rf /tmp/Python-* /tmp/${ARCHIVE} /var/lib/apt/lists/*

ENV PATH=/opt/cpython/bin:${PATH}
WORKDIR /repo
CMD ["python", "-V"]
