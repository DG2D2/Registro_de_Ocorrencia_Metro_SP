CREATE DATABASE IF NOT EXISTS metro_ocorrencias;
USE metro_ocorrencias;

-- Tabela de artigos criminais (ajustada para refletir os tipos reais)
CREATE TABLE ARTIGOS_CRIMINAIS (
    id_artigo INT AUTO_INCREMENT PRIMARY KEY,
    nome_artigo VARCHAR(100) NOT NULL
);

-- Tabela de locais (com linha e estação flexíveis)
CREATE TABLE LOCAL (
    id_local INT AUTO_INCREMENT PRIMARY KEY,
    linha VARCHAR(20) NOT NULL,
    estacao VARCHAR(100) NOT NULL
);

-- Tabela de ocorrências
CREATE TABLE OCORRENCIA ( 
    id_ocorrencia INT AUTO_INCREMENT PRIMARY KEY,
    tipo_ocorrencia VARCHAR(100) NOT NULL,
    data_ocorrido DATE NOT NULL,
    hora_ocorrido TIME NOT NULL,
    descricao TEXT,
    consentimento BOOLEAN NOT NULL,
    id_local INT,
    id_artigo INT,
    FOREIGN KEY (id_local) REFERENCES LOCAL(id_local),
    FOREIGN KEY (id_artigo) REFERENCES ARTIGOS_CRIMINAIS(id_artigo)
);

-- Tabela de pessoas
CREATE TABLE PESSOA (
    id_pessoa INT AUTO_INCREMENT PRIMARY KEY,
    genero ENUM('Masculino', 'Feminino', 'Outro', 'Nao Especificado') NOT NULL,
    idade INT,
    id_ocorrencia INT,
    FOREIGN KEY (id_ocorrencia) REFERENCES OCORRENCIA(id_ocorrencia)
);


